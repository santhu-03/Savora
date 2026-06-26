import { Request, Response } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import { Staff } from '../models/Staff.model';
import { User } from '../models/User';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/apiResponse';
import { AppError } from '../middleware/errorHandler';
import { parsePagination, buildMeta } from '../utils/pagination';
import { sendMail } from '../utils/email';

const staffInviteEmail = (name: string, email: string, tempPassword: string): string => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#111;font-family:Inter,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#1B1B1B;border-radius:16px;border:1px solid rgba(200,155,60,0.15);overflow:hidden;">
    <div style="padding:32px;border-bottom:1px solid rgba(200,155,60,0.1);">
      <div style="font-size:28px;font-weight:600;color:#C89B3C;">Savora</div>
    </div>
    <div style="padding:32px;">
      <h2 style="color:#F7F5F2;margin-top:0;">You're invited to join Savora</h2>
      <p style="color:rgba(247,245,242,0.65);">Hi ${name}, you've been added to the Savora team. Use the credentials below to sign in.</p>
      <div style="background:#252525;border-radius:10px;padding:20px;margin:20px 0;border:1px solid rgba(200,155,60,0.15);">
        <p style="color:#F7F5F2;margin:0 0 8px;"><strong>Email:</strong> ${email}</p>
        <p style="color:#F7F5F2;margin:0;"><strong>Temporary Password:</strong>
          <span style="color:#C89B3C;font-family:monospace;font-size:16px;letter-spacing:1px;">${tempPassword}</span>
        </p>
      </div>
      <p style="color:rgba(247,245,242,0.5);font-size:13px;">Please sign in and change your password immediately for security.</p>
    </div>
    <div style="padding:24px 32px;border-top:1px solid rgba(255,255,255,0.06);color:rgba(247,245,242,0.3);font-size:12px;">
      © ${new Date().getFullYear()} Savora Restaurant
    </div>
  </div>
</body>
</html>`;

const STAFF_ROLE_MAP: Record<string, string> = {
  kitchen: 'line_cook',
  manager: 'manager',
  staff: 'waiter',
};

// GET /api/v1/staff/restaurant/:restaurantId
export const listStaff = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip, sort } = parsePagination(req.query as Record<string, string>);

  const filter: Record<string, unknown> = { restaurant: req.params.restaurantId };
  if (req.query.includeInactive !== 'true') filter.isActive = true;
  if (req.query.role) filter.role = req.query.role;
  if (req.query.isOnDuty === 'true') filter.isOnDuty = true;
  if (req.query.department) filter.department = req.query.department;

  const [data, total] = await Promise.all([
    Staff.find(filter)
      .populate('user', 'name email phone avatar isActive')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Staff.countDocuments(filter),
  ]);

  return ApiResponse.paginated(res, data, buildMeta(total, page, limit));
});

// POST /api/v1/staff/invite
export const inviteStaff = asyncHandler(async (req: Request, res: Response) => {
  const body = z
    .object({
      name: z.string().min(1).max(100),
      email: z.string().email(),
      phone: z.string().optional(),
      role: z.enum(['staff', 'kitchen', 'manager']),
      restaurantId: z.string().min(1),
      department: z.string().min(1),
      employeeId: z.string().optional(),
      salary: z.coerce.number().min(0).default(0),
      salaryType: z.enum(['hourly', 'daily', 'monthly']).default('monthly'),
      joinDate: z.coerce.date().optional(),
    })
    .parse(req.body);

  const existing = await User.findOne({ email: body.email.toLowerCase() });
  if (existing) throw new AppError('A user with this email already exists', 409, 'EMAIL_EXISTS');

  const tempPassword = crypto.randomBytes(8).toString('hex');

  const user = await User.create({
    name: body.name,
    email: body.email.toLowerCase(),
    phone: body.phone,
    password: tempPassword,
    role: body.role,
    restaurantId: body.restaurantId,
    isVerified: true,
  });

  const employeeId = body.employeeId ?? `EMP-${Date.now().toString(36).toUpperCase()}`;

  const staffRecord = await Staff.create({
    user: user._id,
    restaurant: body.restaurantId,
    employeeId,
    role: STAFF_ROLE_MAP[body.role] ?? 'waiter',
    department: body.department,
    joinDate: body.joinDate ?? new Date(),
    salary: body.salary,
    salaryType: body.salaryType,
  });

  await sendMail({
    to: body.email,
    subject: "You've been invited to join Savora",
    html: staffInviteEmail(body.name, body.email, tempPassword),
  });

  return ApiResponse.created(res, { user, staff: staffRecord }, 'Staff invited successfully');
});

// PATCH /api/v1/staff/:id
export const updateStaff = asyncHandler(async (req: Request, res: Response) => {
  const allowed = z
    .object({
      role: z.string().optional(),
      department: z.string().optional(),
      salary: z.number().optional(),
      salaryType: z.enum(['hourly', 'daily', 'monthly']).optional(),
      permissions: z.array(z.string()).optional(),
      isOnDuty: z.boolean().optional(),
    })
    .partial()
    .parse(req.body);

  const staff = await Staff.findByIdAndUpdate(
    req.params.id,
    { $set: allowed },
    { new: true, runValidators: true }
  ).populate('user', 'name email phone avatar');

  if (!staff) throw new AppError('Staff member not found', 404);
  return ApiResponse.success(res, staff, 'Staff updated');
});

// DELETE /api/v1/staff/:id
export const deactivateStaff = asyncHandler(async (req: Request, res: Response) => {
  const { reason } = z.object({ reason: z.string().optional() }).parse(req.body);

  const staff = await Staff.findByIdAndUpdate(
    req.params.id,
    { isActive: false, terminatedAt: new Date(), terminationReason: reason },
    { new: true }
  );
  if (!staff) throw new AppError('Staff member not found', 404);

  await User.findByIdAndUpdate((staff as any).user, { isActive: false });

  return ApiResponse.success(res, staff, 'Staff deactivated');
});

// GET /api/v1/staff/:id/schedule
export const getSchedule = asyncHandler(async (req: Request, res: Response) => {
  const staff = await Staff.findById(req.params.id, 'shifts user employeeId role department');
  if (!staff) throw new AppError('Staff member not found', 404);
  return ApiResponse.success(res, (staff as any).shifts ?? []);
});

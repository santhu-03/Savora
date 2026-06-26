import { Request, Response } from 'express';
import QRCode from 'qrcode';
import PDFDocument from 'pdfkit';
import { Table } from '../models/Table.model';
import { Restaurant } from '../models/Restaurant';
import { cloudinary } from '../config/cloudinary';
import { cache } from '../config/redis';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/apiResponse';
import { AppError } from '../middleware/errorHandler';
import { createOrder } from '../services/order.service';
import { logger } from '../utils/logger';
import { z } from 'zod';

const QR_BASE_URL = process.env.QR_MENU_URL ?? 'https://savora.app/menu';

// ─── POST /restaurants/:restaurantId/tables/:id/generate-qr ──────
export const generateTableQR = asyncHandler(async (req: Request, res: Response) => {
  const { restaurantId, id } = req.params;

  const table = await Table.findOne({ _id: id, restaurant: restaurantId });
  if (!table) throw new AppError('Table not found', 404);

  const menuUrl = `${QR_BASE_URL}/${id}`;

  const qrBuffer = await QRCode.toBuffer(menuUrl, {
    type: 'png',
    width: 400,
    margin: 2,
    color: { dark: '#260B10', light: '#FFFFFF' },
    errorCorrectionLevel: 'M',
  });

  const uploadResult = await new Promise<{ secure_url: string; public_id: string }>(
    (resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: 'savora/qr-codes',
            public_id: `table-${id}`,
            resource_type: 'image',
            overwrite: true,
            format: 'png',
          },
          (err, result) => (err ? reject(err) : resolve(result as any))
        )
        .end(qrBuffer);
    }
  );

  table.qrCode = menuUrl;
  table.qrCodeUrl = uploadResult.secure_url;
  await table.save();

  await cache.del(`tables:${restaurantId}`, `qr-menu:${id}`);

  logger.info('QR code generated', { tableId: id, restaurantId });

  ApiResponse.success(res, {
    qrCodeUrl: uploadResult.secure_url,
    menuUrl,
    tableId: id,
    tableNumber: (table as any).number,
  });
});

// ─── POST /restaurants/:id/generate-all-qr → streams PDF ─────────
export const generateAllQRPdf = asyncHandler(async (req: Request, res: Response) => {
  const restaurantId = req.params.id;

  const [restaurant, tables] = await Promise.all([
    Restaurant.findById(restaurantId).select('name logo'),
    Table.find({ restaurant: restaurantId, isActive: true }).sort({ section: 1, number: 1 }),
  ]);

  if (!restaurant) throw new AppError('Restaurant not found', 404);
  if (!tables.length) throw new AppError('No active tables found', 404);

  const restaurantName = (restaurant as any).name as string;

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${restaurantName.replace(/[^a-z0-9]/gi, '-')}-QR-codes.pdf"`
  );

  const doc = new PDFDocument({ size: 'A4', margin: 0, autoFirstPage: true });
  doc.pipe(res);

  const PAGE_W = doc.page.width;   // 595.28
  const PAGE_H = doc.page.height;  // 841.89
  const COLS   = 2;
  const ROWS   = 2;
  const CELL_W = PAGE_W / COLS;
  const CELL_H = PAGE_H / ROWS;
  const PAD    = 28;
  const QR_SIZE = 168;
  const ACCENT  = '#BF8B5E';
  const BG      = '#260B10';

  for (let i = 0; i < tables.length; i++) {
    const table = tables[i];
    const posOnPage = i % (COLS * ROWS);
    const col = posOnPage % COLS;
    const row = Math.floor(posOnPage / COLS);

    if (i > 0 && posOnPage === 0) doc.addPage();

    const x = col * CELL_W;
    const y = row * CELL_H;
    const menuUrl = `${QR_BASE_URL}/${table._id}`;

    try {
      const qrBuffer = await QRCode.toBuffer(menuUrl, {
        type: 'png',
        width: QR_SIZE * 2,
        margin: 1,
        color: { dark: '#260B10', light: '#FFFFFF' },
        errorCorrectionLevel: 'M',
      });

      // Cell background
      doc.rect(x, y, CELL_W, CELL_H).fill(BG);

      // Inner gold border
      const BP = 14;
      doc
        .rect(x + BP, y + BP, CELL_W - BP * 2, CELL_H - BP * 2)
        .strokeColor(ACCENT)
        .lineWidth(0.5)
        .stroke();

      // Restaurant name
      doc
        .fillColor(ACCENT)
        .font('Helvetica')
        .fontSize(8)
        .text(restaurantName.toUpperCase(), x + PAD, y + PAD + 14, {
          width: CELL_W - PAD * 2,
          align: 'center',
          characterSpacing: 2,
        });

      // Table number
      const tableLabel = `Table ${(table as any).number ?? (table as any).displayName ?? ''}`;
      doc
        .fillColor('#FFFFFF')
        .font('Helvetica-Bold')
        .fontSize(20)
        .text(tableLabel, x + PAD, y + PAD + 32, { width: CELL_W - PAD * 2, align: 'center' });

      // Section tag
      const section = (table as any).section;
      if (section && section !== 'Main') {
        doc
          .fillColor(ACCENT)
          .font('Helvetica')
          .fontSize(7)
          .text(section.toUpperCase(), x + PAD, y + PAD + 58, {
            width: CELL_W - PAD * 2,
            align: 'center',
            characterSpacing: 1.5,
          });
      }

      // QR code
      const qrX = x + (CELL_W - QR_SIZE) / 2;
      const qrY = y + CELL_H / 2 - QR_SIZE / 2 - 8;
      doc.image(qrBuffer, qrX, qrY, { width: QR_SIZE, height: QR_SIZE });

      // "Scan to view our menu"
      doc
        .fillColor(ACCENT)
        .font('Helvetica')
        .fontSize(9)
        .text('Scan to view our menu', x + PAD, y + CELL_H - 62, {
          width: CELL_W - PAD * 2,
          align: 'center',
          characterSpacing: 1,
        });

      // Capacity
      const minCap = (table as any).minCapacity ?? 1;
      const maxCap = (table as any).maxCapacity ?? (table as any).capacity ?? 4;
      doc
        .fillColor('#7A5040')
        .font('Helvetica')
        .fontSize(7)
        .text(`${minCap}–${maxCap} guests`, x + PAD, y + CELL_H - 44, {
          width: CELL_W - PAD * 2,
          align: 'center',
        });

      // Persist QR to table (best-effort)
      table.qrCode = menuUrl;
      await table.save().catch(() => {});
    } catch (err) {
      logger.error('PDF QR gen failed for table', { tableId: table._id, err });
      // draw error cell
      doc
        .fillColor('#FFFFFF')
        .font('Helvetica')
        .fontSize(9)
        .text(`Table ${(table as any).number} — QR failed`, x + PAD, y + CELL_H / 2, {
          width: CELL_W - PAD * 2,
          align: 'center',
        });
    }
  }

  doc.end();
});

// ─── POST /api/qr-menu/order — guest checkout (no auth) ──────────
const guestOrderSchema = z.object({
  tableId:      z.string().min(1),
  restaurantId: z.string().min(1),
  guestName:    z.string().max(100).optional(),
  items: z
    .array(
      z.object({
        menuItemId:          z.string().min(1),
        quantity:            z.number().int().positive(),
        specialInstructions: z.string().max(300).optional(),
      })
    )
    .min(1, 'At least one item is required'),
});

export const placeGuestOrder = asyncHandler(async (req: Request, res: Response) => {
  const body = guestOrderSchema.parse(req.body);

  const order = await createOrder({
    restaurantId: body.restaurantId,
    tableId:      body.tableId,
    type:         'dine-in',
    items:        body.items,
    notes:        body.guestName ? `Guest: ${body.guestName}` : undefined,
  });

  ApiResponse.created(
    res,
    {
      orderId:     order._id.toString(),
      orderNumber: order.orderNumber,
      status:      order.status,
    },
    'Order placed successfully'
  );
});

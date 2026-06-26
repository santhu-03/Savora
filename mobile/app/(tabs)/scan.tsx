import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { C } from '../../src/lib/colors';

const { width: W } = Dimensions.get('window');

// Conditional import — only loads on device builds
let CameraView: any = null;
let useCameraPermissions: any = null;
try {
  const cam = require('expo-camera');
  CameraView = cam.CameraView;
  useCameraPermissions = cam.useCameraPermissions;
} catch {}

function Corner({ position }: { position: 'tl' | 'tr' | 'bl' | 'br' }) {
  const top    = position.startsWith('t');
  const left   = position.endsWith('l');
  return (
    <View style={[
      S.corner,
      top  ? S.cornerT : S.cornerB,
      left ? S.cornerL : S.cornerR,
    ]}>
      <View style={[S.cornerH, !top && { bottom: 0 }, !left && { right: 0 }]} />
      <View style={[S.cornerV, !top && { bottom: 0 }, !left && { right: 0 }]} />
    </View>
  );
}

export default function ScanScreen() {
  const router        = useRouter();
  const [manual, setManual] = useState(false);
  const [tableInput, setTableInput] = useState('');
  const [scanned, setScanned]       = useState(false);
  const [muted, setMuted]           = useState(false);

  // Camera permissions hook
  const perms   = useCameraPermissions ? useCameraPermissions() : [null, null];
  const permission       = perms[0];
  const requestPermission= perms[1];

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    // Parse QR: expects URL like savora://menu/42 or just a table ID
    const match = data.match(/menu\/(\w+)/) ?? data.match(/^(\d+)$/);
    const tableId = match?.[1] ?? data;
    setTimeout(() => {
      router.push(`/menu/${tableId}`);
      setScanned(false);
    }, 300);
  };

  const handleManualEntry = () => {
    if (!tableInput.trim()) return;
    router.push(`/menu/${tableInput.trim()}`);
  };

  const noCamera = !CameraView || !useCameraPermissions;

  return (
    <View style={S.root}>
      <StatusBar style="light" />

      {!noCamera && permission && !permission.granted ? (
        <SafeAreaView style={S.permWrap}>
          <Ionicons name="camera-outline" size={64} color={C.gold} />
          <Text style={S.permTitle}>Camera Access Needed</Text>
          <Text style={S.permDesc}>Allow camera access to scan table QR codes at Savora restaurants</Text>
          <TouchableOpacity style={S.permBtn} onPress={requestPermission}>
            <Text style={S.permBtnText}>Allow Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity style={S.manualLink} onPress={() => setManual(true)}>
            <Text style={S.manualLinkText}>Enter table number manually</Text>
          </TouchableOpacity>
        </SafeAreaView>
      ) : (
        <>
          {/* Camera view */}
          {!noCamera && CameraView && (
            <CameraView
              style={StyleSheet.absoluteFill}
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
            />
          )}

          {/* Dark overlay with transparent center */}
          <View style={S.overlay}>
            <View style={S.overlayTop} />
            <View style={S.overlayMiddle}>
              <View style={S.overlaySide} />
              <View style={S.viewfinder}>
                <Corner position="tl" />
                <Corner position="tr" />
                <Corner position="bl" />
                <Corner position="br" />
                {scanned && <View style={S.scannedFlash} />}
              </View>
              <View style={S.overlaySide} />
            </View>
            <View style={S.overlayBottom} />
          </View>

          {/* Top nav */}
          <SafeAreaView style={S.topNav}>
            <View style={S.topNavInner}>
              <Text style={S.scanTitle}>Scan QR Code</Text>
              <TouchableOpacity onPress={() => setMuted(!muted)}>
                <Ionicons name={muted ? 'volume-mute' : 'volume-high'} size={22} color="#fff" />
              </TouchableOpacity>
            </View>
            <Text style={S.scanHint}>Point your camera at the QR code on your table</Text>
          </SafeAreaView>

          {/* Bottom controls */}
          <View style={S.bottomControls}>
            {noCamera && (
              <View style={S.noCameraNote}>
                <Text style={S.noCameraText}>Camera requires a dev build. Use manual entry below.</Text>
              </View>
            )}

            {!manual ? (
              <>
                <TouchableOpacity style={S.manualBtn} onPress={() => setManual(true)}>
                  <Ionicons name="keypad-outline" size={18} color={C.gold} />
                  <Text style={S.manualBtnText}>Enter table number manually</Text>
                </TouchableOpacity>
              </>
            ) : (
              <View style={S.manualWrap}>
                <Text style={S.manualLabel}>Table Number</Text>
                <View style={S.manualRow}>
                  <TextInput
                    style={S.manualInput}
                    placeholder="e.g. 12"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    value={tableInput}
                    onChangeText={setTableInput}
                    keyboardType="number-pad"
                    autoFocus
                  />
                  <TouchableOpacity style={S.goBtn} onPress={handleManualEntry}>
                    <Ionicons name="arrow-forward" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity onPress={() => setManual(false)}>
                  <Text style={S.cancelManual}>Cancel</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </>
      )}
    </View>
  );
}

const VFSIZE = W * 0.68;
const CORNER = 22;

const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },

  permWrap:    { flex: 1, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', padding: 40 },
  permTitle:   { fontSize: 22, fontWeight: '700', color: C.cream, marginTop: 20, marginBottom: 8 },
  permDesc:    { fontSize: 14, color: 'rgba(253,248,243,0.5)', textAlign: 'center', lineHeight: 22 },
  permBtn:     { marginTop: 24, backgroundColor: C.gold, borderRadius: 14, paddingHorizontal: 32, paddingVertical: 14 },
  permBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  manualLink:  { marginTop: 16 },
  manualLinkText: { color: C.gold, fontSize: 14 },

  overlay: { ...StyleSheet.absoluteFillObject },
  overlayTop:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)' },
  overlayMiddle: { flexDirection: 'row', height: VFSIZE },
  overlaySide:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)' },
  viewfinder:    { width: VFSIZE, height: VFSIZE, position: 'relative' },
  overlayBottom: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)' },

  scannedFlash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(191,139,94,0.35)',
    borderRadius: 4,
  },

  corner: { position: 'absolute', width: CORNER, height: CORNER },
  cornerT: { top: 0 },    cornerB: { bottom: 0 },
  cornerL: { left: 0 },   cornerR: { right: 0 },
  cornerH: {
    position: 'absolute', left: 0, right: 0, height: 3, backgroundColor: C.gold, borderRadius: 2,
  },
  cornerV: {
    position: 'absolute', top: 0, bottom: 0, width: 3, backgroundColor: C.gold, borderRadius: 2,
  },

  topNav: { position: 'absolute', top: 0, left: 0, right: 0 },
  topNavInner: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 24, paddingTop: 16, paddingBottom: 6,
  },
  scanTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  scanHint:  { color: 'rgba(255,255,255,0.55)', fontSize: 13, textAlign: 'center', paddingHorizontal: 40, paddingBottom: 8 },

  bottomControls: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingBottom: 48, paddingHorizontal: 24, alignItems: 'center',
  },
  noCameraNote: {
    backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 10,
    padding: 10, marginBottom: 14, width: '100%',
  },
  noCameraText: { color: 'rgba(255,255,255,0.55)', fontSize: 12, textAlign: 'center' },

  manualBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14, paddingHorizontal: 20, paddingVertical: 13,
    borderWidth: 1, borderColor: 'rgba(191,139,94,0.25)',
  },
  manualBtnText: { color: C.gold, fontSize: 14, fontWeight: '600' },

  manualWrap: { width: '100%', alignItems: 'center', gap: 12 },
  manualLabel: { color: 'rgba(255,255,255,0.55)', fontSize: 12, letterSpacing: 1 },
  manualRow: { flexDirection: 'row', gap: 10, width: '100%' },
  manualInput: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12, padding: 14, color: '#fff', fontSize: 20,
    fontWeight: '700', textAlign: 'center', letterSpacing: 4,
    borderWidth: 1, borderColor: 'rgba(191,139,94,0.3)',
  },
  goBtn: {
    width: 52, borderRadius: 12, backgroundColor: C.gold,
    alignItems: 'center', justifyContent: 'center',
  },
  cancelManual: { color: 'rgba(255,255,255,0.4)', fontSize: 13 },
});

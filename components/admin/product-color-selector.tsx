'use client';

import React, { useState, useCallback, useMemo } from 'react';
import {
  ColorOption,
  RGB,
  DEFAULT_PRODUCT_COLORS,
  PRESET_LUXURY_COLORS,
  hexToRgb,
  rgbToHex,
  isValidHex,
  normalizeHex,
  suggestColorName,
  saveStoredColors,
} from '@/lib/colors';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Plus,
  X,
  RotateCcw,
  Pipette,
  Palette,
  Sparkles,
  SlidersHorizontal,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';

interface ProductColorSelectorProps {
  selectedColors: string[];
  onChange: (colors: string[]) => void;
  colorsList: ColorOption[];
  onColorsListChange: (colors: ColorOption[]) => void;
}

export function ProductColorSelector({
  selectedColors,
  onChange,
  colorsList,
  onColorsListChange,
}: ProductColorSelectorProps) {
  const [showAddColor, setShowAddColor] = useState(false);
  const [isManageMode, setIsManageMode] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Picker states
  const [pickedHex, setPickedHex] = useState('#800020'); // Burgundy default
  const [hexInput, setHexInput] = useState('800020');
  const [colorName, setColorName] = useState('Burgundy');
  const [rgb, setRgb] = useState<RGB>({ r: 128, g: 0, b: 32 });
  const [rStr, setRStr] = useState('128');
  const [gStr, setGStr] = useState('0');
  const [bStr, setBStr] = useState('32');

  // Eyedropper API availability
  const hasEyeDropper = typeof window !== 'undefined' && 'EyeDropper' in window;

  // Sync state from RGB channels
  const updateFromRgbValues = (newR: number, newG: number, newB: number) => {
    const clampedR = Math.max(0, Math.min(255, newR));
    const clampedG = Math.max(0, Math.min(255, newG));
    const clampedB = Math.max(0, Math.min(255, newB));
    setRgb({ r: clampedR, g: clampedG, b: clampedB });
    setRStr(String(clampedR));
    setGStr(String(clampedG));
    setBStr(String(clampedB));
    const newHex = rgbToHex(clampedR, clampedG, clampedB);
    setPickedHex(newHex);
    setHexInput(newHex.replace('#', ''));
  };

  // Slider change handler
  const handleSliderChange = (channel: keyof RGB, value: number) => {
    const newR = channel === 'r' ? value : rgb.r;
    const newG = channel === 'g' ? value : rgb.g;
    const newB = channel === 'b' ? value : rgb.b;
    updateFromRgbValues(newR, newG, newB);
  };

  // Number input change handler
  const handleRgbNumberChange = (channel: keyof RGB, rawValue: string) => {
    if (channel === 'r') setRStr(rawValue);
    if (channel === 'g') setGStr(rawValue);
    if (channel === 'b') setBStr(rawValue);

    if (rawValue.trim() === '') return;
    const parsed = parseInt(rawValue, 10);
    if (!isNaN(parsed)) {
      const clamped = Math.max(0, Math.min(255, parsed));
      const newR = channel === 'r' ? clamped : rgb.r;
      const newG = channel === 'g' ? clamped : rgb.g;
      const newB = channel === 'b' ? clamped : rgb.b;
      setRgb({ r: newR, g: newG, b: newB });
      const newHex = rgbToHex(newR, newG, newB);
      setPickedHex(newHex);
      setHexInput(newHex.replace('#', ''));
    }
  };

  // Number input blur handler to clamp cleanly
  const handleRgbNumberBlur = (channel: keyof RGB) => {
    const rawValue = channel === 'r' ? rStr : channel === 'g' ? gStr : bStr;
    const parsed = parseInt(rawValue, 10);
    const clamped = isNaN(parsed) ? 0 : Math.max(0, Math.min(255, parsed));
    if (channel === 'r') setRStr(String(clamped));
    if (channel === 'g') setGStr(String(clamped));
    if (channel === 'b') setBStr(String(clamped));
  };

  // Hex input change handler (supports pasting #HEX or HEX)
  const handleHexInputChange = (rawVal: string) => {
    const clean = rawVal.replace(/[^0-9A-Fa-f]/g, '').slice(0, 6);
    setHexInput(clean);

    if (clean.length === 3 || clean.length === 6) {
      const normalized = normalizeHex(clean);
      setPickedHex(normalized);
      const parsedRgb = hexToRgb(normalized);
      setRgb(parsedRgb);
      setRStr(String(parsedRgb.r));
      setGStr(String(parsedRgb.g));
      setBStr(String(parsedRgb.b));
    }
  };

  // Native color wheel change handler
  const handleNativeColorChange = (hexValue: string) => {
    const normalized = normalizeHex(hexValue);
    setPickedHex(normalized);
    setHexInput(normalized.replace('#', ''));
    const parsedRgb = hexToRgb(normalized);
    setRgb(parsedRgb);
    setRStr(String(parsedRgb.r));
    setGStr(String(parsedRgb.g));
    setBStr(String(parsedRgb.b));
    if (!colorName || colorName === 'Custom Color') {
      setColorName(suggestColorName(normalized));
    }
  };

  // Eyedropper API
  const handleEyeDropper = async () => {
    if (!hasEyeDropper) return;
    try {
      // @ts-ignore EyeDropper API
      const eyeDropper = new window.EyeDropper();
      const result = await eyeDropper.open();
      if (result?.sRGBHex) {
        handleNativeColorChange(result.sRGBHex);
        setColorName(suggestColorName(result.sRGBHex));
      }
    } catch {
      // Cancelled by user
    }
  };

  // Auto-suggest name
  const handleAutoSuggestName = () => {
    const suggested = suggestColorName(pickedHex);
    setColorName(suggested);
  };

  // Select a preset color
  const handleSelectPreset = (preset: ColorOption) => {
    const normalized = normalizeHex(preset.hex);
    setPickedHex(normalized);
    setHexInput(normalized.replace('#', ''));
    setColorName(preset.name);
    const parsedRgb = hexToRgb(normalized);
    setRgb(parsedRgb);
    setRStr(String(parsedRgb.r));
    setGStr(String(parsedRgb.g));
    setBStr(String(parsedRgb.b));
  };

  // Toggle selection of a color for product variants
  const handleToggleColor = (name: string) => {
    if (selectedColors.includes(name)) {
      onChange(selectedColors.filter((c) => c !== name));
    } else {
      onChange([...selectedColors, name]);
    }
  };

  // Add new color to the list
  const handleAddColor = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const normalizedName = (colorName.trim() || suggestColorName(pickedHex)).trim();
    const finalHex = normalizeHex(pickedHex);

    if (!normalizedName) {
      toast.error('Please specify a color name');
      return;
    }

    // Check if color name already exists (case-insensitive)
    const existingIndex = colorsList.findIndex(
      (c) => c.name.toLowerCase() === normalizedName.toLowerCase()
    );

    let updatedList: ColorOption[];

    if (existingIndex >= 0) {
      // Update existing color's hex
      updatedList = colorsList.map((c, idx) =>
        idx === existingIndex
          ? { ...c, hex: finalHex, isCustom: true }
          : c
      );
      toast.success(`Updated color "${normalizedName}" (${finalHex})`);
    } else {
      // Add new color
      const newColor: ColorOption = {
        name: normalizedName,
        hex: finalHex,
        isCustom: true,
      };
      updatedList = [...colorsList, newColor];
      toast.success(`Added color "${normalizedName}" to palette`);
    }

    onColorsListChange(updatedList);
    saveStoredColors(updatedList);

    // Automatically select the new color for this product
    if (!selectedColors.includes(normalizedName)) {
      onChange([...selectedColors, normalizedName]);
    }

    // Reset picker and close form
    setShowAddColor(false);
  };

  // Delete an existing color
  const handleDeleteColor = (nameToDelete: string) => {
    const colorToDelete = colorsList.find((c) => c.name === nameToDelete);
    if (!colorToDelete) return;

    const updatedList = colorsList.filter((c) => c.name !== nameToDelete);
    onColorsListChange(updatedList);
    saveStoredColors(updatedList);

    // Remove from selectedColors if present
    if (selectedColors.includes(nameToDelete)) {
      onChange(selectedColors.filter((c) => c !== nameToDelete));
    }

    // Provide undo toast
    toast.success(`Removed color "${nameToDelete}"`, {
      action: {
        label: 'Undo',
        onClick: () => {
          const restoredList = [...updatedList, colorToDelete];
          onColorsListChange(restoredList);
          saveStoredColors(restoredList);
        },
      },
    });
  };

  // Reset to default factory colors with confirmation
  const handleConfirmResetDefaults = () => {
    onColorsListChange(DEFAULT_PRODUCT_COLORS);
    saveStoredColors(DEFAULT_PRODUCT_COLORS);
    setIsManageMode(false);
    setShowResetConfirm(false);
    toast.success('Reset color palette to default factory colors');
  };

  return (
    <div className="space-y-3">
      {/* Header & Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Label className="text-xs text-zinc-400 font-medium">Colors to Generate *</Label>
          {selectedColors.length > 0 && (
            <span className="text-[11px] text-amber-400 font-semibold">
              ({selectedColors.length} selected)
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setShowAddColor((prev) => !prev);
              if (isManageMode) setIsManageMode(false);
            }}
            className={`h-7 px-2.5 text-xs transition-colors ${
              showAddColor
                ? 'bg-amber-500 text-black border-amber-500 hover:bg-amber-600'
                : 'border-amber-500/40 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 hover:border-amber-500/60'
            }`}
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            {showAddColor ? 'Close Picker' : 'Add Color'}
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setIsManageMode((prev) => !prev);
              setShowResetConfirm(false);
            }}
            className={`h-7 px-2 text-xs transition-colors ${
              isManageMode
                ? 'text-amber-400 bg-amber-500/15'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
            }`}
            title={isManageMode ? 'Exit color management' : 'Manage & delete colors'}
          >
            <SlidersHorizontal className="w-3 h-3 mr-1" />
            {isManageMode ? 'Done' : 'Manage'}
          </Button>

          {isManageMode && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowResetConfirm(true)}
              className="h-7 px-2 text-xs text-zinc-500 hover:text-amber-400 hover:bg-white/5"
              title="Reset to default factory colors"
            >
              <RotateCcw className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Reset Confirmation Bar */}
      {showResetConfirm && (
        <div className="flex items-center justify-between p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs">
          <div className="flex items-center gap-2 text-amber-300">
            <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>Reset palette to factory 10 colors?</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowResetConfirm(false)}
              className="px-2 py-1 text-zinc-400 hover:text-white text-xs"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmResetDefaults}
              className="px-2.5 py-1 rounded bg-amber-500 text-black font-semibold text-xs hover:bg-amber-600"
            >
              Confirm Reset
            </button>
          </div>
        </div>
      )}

      {/* Color Swatches Grid (Matches screenshot styling with double-amber ring) */}
      <div className="flex flex-wrap gap-3 items-center">
        {colorsList.map((c) => {
          const isSelected = selectedColors.includes(c.name);

          return (
            <div key={c.name} className="relative">
              <button
                type="button"
                title={`${c.name} (${c.hex})`}
                aria-label={`Color: ${c.name} (${c.hex})`}
                onClick={() => {
                  if (isManageMode) {
                    handleDeleteColor(c.name);
                  } else {
                    handleToggleColor(c.name);
                  }
                }}
                style={{ backgroundColor: c.hex }}
                className={`w-10 h-10 rounded-full border-2 transition-all flex items-center justify-center flex-shrink-0 cursor-pointer ${
                  isSelected
                    ? 'border-amber-500 ring-2 ring-amber-500 ring-offset-2 ring-offset-zinc-950 scale-105 shadow-md shadow-amber-500/25'
                    : 'border-white/20 hover:scale-110 hover:border-white/40'
                } ${
                  isManageMode
                    ? 'ring-2 ring-dashed ring-red-400/50 hover:ring-red-400'
                    : ''
                }`}
              />

              {/* Delete Button (Visible ONLY in Manage Mode to prevent accidental deletes on hover) */}
              {isManageMode && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteColor(c.name);
                  }}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-lg transition-transform hover:scale-115 z-20 cursor-pointer"
                  title={`Delete ${c.name}`}
                  aria-label={`Delete ${c.name}`}
                >
                  <X className="w-3 h-3 stroke-[3]" />
                </button>
              )}
            </div>
          );
        })}

        {/* Quick Add Button at end of swatch line */}
        {!showAddColor && (
          <button
            type="button"
            onClick={() => {
              setShowAddColor(true);
              if (isManageMode) setIsManageMode(false);
            }}
            className="w-10 h-10 rounded-full border-2 border-dashed border-amber-500/40 hover:border-amber-400 hover:bg-amber-500/10 flex items-center justify-center text-amber-400 transition-all hover:scale-105 flex-shrink-0"
            title="Add new color with RGB picker"
            aria-label="Add new color"
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Selected Color Chips */}
      {selectedColors.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[11px] text-zinc-500">Selected:</span>
          {selectedColors.map((name) => {
            const colorObj = colorsList.find((col) => col.name === name);
            return (
              <span
                key={name}
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs bg-amber-500/10 text-amber-300 border border-amber-500/25 transition-all"
              >
                <span
                  className="w-2.5 h-2.5 rounded-full border border-white/20 flex-shrink-0"
                  style={{ backgroundColor: colorObj?.hex ?? '#888888' }}
                />
                {name}
                <button
                  type="button"
                  onClick={() => handleToggleColor(name)}
                  className="hover:text-white transition-colors ml-0.5"
                  title={`Deselect ${name}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            );
          })}
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-[11px] text-zinc-500 hover:text-amber-400 ml-1.5 underline decoration-dotted"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Expandable RGB & HEX Color Picker Card */}
      {showAddColor && (
        <div className="rounded-xl border border-amber-500/30 bg-zinc-900/95 backdrop-blur-md p-4 space-y-4 shadow-2xl transition-all animate-in fade-in-0 zoom-in-95">
          <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
              <Palette className="w-4 h-4" />
              <span>RGB Color Picker & Custom Palette</span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowAddColor(false)}
              className="h-6 w-6 p-0 text-zinc-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>

          {/* Color Preview & Name Input */}
          <div className="flex items-center gap-3">
            {/* Live Preview / Native Clickable Picker */}
            <div className="relative flex-shrink-0">
              <div
                className="w-14 h-14 rounded-2xl border-2 border-white/20 shadow-inner flex items-center justify-center cursor-pointer transition-transform hover:scale-105 overflow-hidden"
                style={{ backgroundColor: isValidHex(pickedHex) ? pickedHex : '#800020' }}
                title="Click to open system color wheel"
              >
                {/* Overlay native color picker */}
                <input
                  type="color"
                  value={isValidHex(pickedHex) ? normalizeHex(pickedHex) : '#800020'}
                  onChange={(e) => handleNativeColorChange(e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full scale-150"
                  title="Click to open system color wheel"
                />
              </div>

              {hasEyeDropper && (
                <button
                  type="button"
                  onClick={handleEyeDropper}
                  className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-zinc-800 hover:bg-zinc-700 text-amber-400 border border-white/10 flex items-center justify-center shadow-md transition-transform hover:scale-110"
                  title="Pick color from screen (Eyedropper)"
                >
                  <Pipette className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Name input and quick auto-suggest */}
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-[11px] text-zinc-400 font-medium">Color Name</Label>
                <button
                  type="button"
                  onClick={handleAutoSuggestName}
                  className="text-[10px] text-amber-400/80 hover:text-amber-400 flex items-center gap-1 transition-colors"
                >
                  <Sparkles className="w-2.5 h-2.5" />
                  Auto-name
                </button>
              </div>
              <Input
                value={colorName}
                onChange={(e) => setColorName(e.target.value)}
                placeholder="e.g. Burgundy, Espresso, Emerald"
                className="h-9 bg-zinc-950 border-white/10 text-xs text-white placeholder:text-zinc-600 focus-visible:ring-amber-500/50"
              />
            </div>
          </div>

          {/* HEX & RGB Controls */}
          <div className="space-y-3 bg-zinc-950/60 p-3 rounded-lg border border-white/5">
            {/* Hex Input */}
            <div className="flex items-center gap-2">
              <Label className="text-[11px] text-zinc-400 w-12 font-mono">HEX</Label>
              <div className="relative flex-1">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-zinc-500 font-mono">
                  #
                </span>
                <Input
                  value={hexInput}
                  onChange={(e) => handleHexInputChange(e.target.value)}
                  maxLength={7}
                  placeholder="800020"
                  className="h-8 pl-6 bg-zinc-900 border-white/10 text-xs text-white font-mono uppercase focus-visible:ring-amber-500/50"
                />
              </div>
            </div>

            {/* RGB Sliders and Direct Number Inputs */}
            <div className="space-y-2 pt-1">
              {/* Red */}
              <div className="flex items-center gap-2.5">
                <span className="text-[11px] font-mono text-red-400 w-4">R</span>
                <input
                  type="range"
                  min="0"
                  max="255"
                  value={rgb.r}
                  onChange={(e) => handleSliderChange('r', Number(e.target.value))}
                  className="flex-1 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-red-500"
                />
                <Input
                  type="number"
                  min="0"
                  max="255"
                  value={rStr}
                  onChange={(e) => handleRgbNumberChange('r', e.target.value)}
                  onBlur={() => handleRgbNumberBlur('r')}
                  className="w-14 h-7 bg-zinc-900 border-white/10 text-xs text-white font-mono text-center p-1"
                />
              </div>

              {/* Green */}
              <div className="flex items-center gap-2.5">
                <span className="text-[11px] font-mono text-green-400 w-4">G</span>
                <input
                  type="range"
                  min="0"
                  max="255"
                  value={rgb.g}
                  onChange={(e) => handleSliderChange('g', Number(e.target.value))}
                  className="flex-1 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-green-500"
                />
                <Input
                  type="number"
                  min="0"
                  max="255"
                  value={gStr}
                  onChange={(e) => handleRgbNumberChange('g', e.target.value)}
                  onBlur={() => handleRgbNumberBlur('g')}
                  className="w-14 h-7 bg-zinc-900 border-white/10 text-xs text-white font-mono text-center p-1"
                />
              </div>

              {/* Blue */}
              <div className="flex items-center gap-2.5">
                <span className="text-[11px] font-mono text-blue-400 w-4">B</span>
                <input
                  type="range"
                  min="0"
                  max="255"
                  value={rgb.b}
                  onChange={(e) => handleSliderChange('b', Number(e.target.value))}
                  className="flex-1 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <Input
                  type="number"
                  min="0"
                  max="255"
                  value={bStr}
                  onChange={(e) => handleRgbNumberChange('b', e.target.value)}
                  onBlur={() => handleRgbNumberBlur('b')}
                  className="w-14 h-7 bg-zinc-900 border-white/10 text-xs text-white font-mono text-center p-1"
                />
              </div>
            </div>
          </div>

          {/* Quick Presets Section */}
          <div className="space-y-2">
            <Label className="text-[10px] text-zinc-500 uppercase tracking-wider">
              Popular Leather & Footwear Presets
            </Label>
            <div className="flex flex-wrap gap-2">
              {PRESET_LUXURY_COLORS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  title={`${preset.name} (${preset.hex})`}
                  style={{ backgroundColor: preset.hex }}
                  className={`w-6 h-6 rounded-full border border-white/20 transition-transform hover:scale-125 cursor-pointer ${
                    pickedHex.toUpperCase() === preset.hex.toUpperCase()
                      ? 'ring-2 ring-amber-400 ring-offset-1 ring-offset-zinc-950 scale-110'
                      : ''
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Footer Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-1 border-t border-white/10">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowAddColor(false)}
              className="h-8 text-xs border-white/10 text-zinc-400 bg-transparent hover:bg-white/5"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleAddColor}
              className="h-8 text-xs bg-amber-500 hover:bg-amber-600 text-black font-medium"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Add to Palette
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

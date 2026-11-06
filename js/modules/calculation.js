import { Store } from '../store.js';
import { renderQuotations } from './quotations.js';
export function convertUnit(val, fromUnit, toUnit) {
    if (val === undefined || val === null || isNaN(val)) return 0;
    const num = Number(val);
    if (!fromUnit || !toUnit || fromUnit === toUnit) return num;
    
    // Normalize fromUnit to mm
    let mm = num;
    const from = String(fromUnit).toLowerCase();
    if (from === 'cm') mm = num * 10;
    else if (from === 'inch' || from === 'in') mm = num * 25.4;
    else if (from === 'ft' || from === 'feet') mm = num * 304.8;
    else if (from === 'm' || from === 'meter') mm = num * 1000;
    
    // Convert mm to toUnit
    const to = String(toUnit).toLowerCase();
    if (to === 'mm') return Math.round(mm);
    if (to === 'cm') return Number((mm / 10).toFixed(1));
    if (to === 'inch' || to === 'in') return Number((mm / 25.4).toFixed(2));
    if (to === 'ft' || to === 'feet') return Number((mm / 304.8).toFixed(2));
    if (to === 'm' || to === 'meter') return Number((mm / 1000).toFixed(3));
    return num;
}
window.convertUnit = convertUnit;

export function computePaneGrill(spanWidthCm, spanHeightCm, orientation = 'horizontal', manualCount = null) {
    const pipeThickCm = 2.0; // 20x20 mm square tube = 2.0 cm
    const targetGapMin = 7.5;
    const targetGapMax = 9.5;
    const targetGapIdeal = 8.5; // recommended: 8.0 to 9.5 cm

    const span = orientation === 'vertical' ? spanWidthCm : spanHeightCm;
    const pipeLengthCm = orientation === 'vertical' ? spanHeightCm : spanWidthCm;

    let count = 0;
    let gap = 0;

    if (manualCount !== null && manualCount !== undefined) {
        count = Math.max(0, parseInt(manualCount) || 0);
        gap = count > 0 ? (span - (count * pipeThickCm)) / (count + 1) : span;
    } else {
        if (span > targetGapMin) {
            const approxN = Math.round((span - targetGapIdeal) / (targetGapIdeal + pipeThickCm));
            count = Math.max(1, approxN);
            gap = (span - (count * pipeThickCm)) / (count + 1);

            if (gap < targetGapMin && count > 1) {
                const altCount = count - 1;
                const altGap = (span - (altCount * pipeThickCm)) / (altCount + 1);
                if (Math.abs(altGap - targetGapIdeal) < Math.abs(gap - targetGapIdeal) || gap < targetGapMin) {
                    count = altCount;
                    gap = altGap;
                }
            } else if (gap > targetGapMax) {
                const altCount = count + 1;
                const altGap = (span - (altCount * pipeThickCm)) / (altCount + 1);
                if (altGap >= targetGapMin) {
                    count = altCount;
                    gap = altGap;
                }
            }
        }
    }

    return {
        count: Math.max(0, count),
        gapCm: parseFloat(Math.max(0, gap).toFixed(1)),
        pipeLengthCm: Math.max(0, pipeLengthCm),
        totalLengthCm: Math.max(0, count * pipeLengthCm)
    };
}
window.computePaneGrill = computePaneGrill;

/**
 * Window Fabrication Costing & Material Calculation Engine
 * Implements benchmark formulas and engineering specs from window calcu-formula.md
 */
export function calculateWindowFabrication(config = {}) {
    const unit = (config.unit || Store.state.settings?.preferences?.unit || 'cm').toLowerCase();
    const rawW = parseFloat(config.width ?? config.totalW) || 150;
    const rawH = parseFloat(config.height ?? config.totalH) || 160;

    // Normalize input dimensions to standard metric units
    const widthMm = convertUnit(rawW, unit, 'mm');
    const heightMm = convertUnit(rawH, unit, 'mm');
    const widthM = widthMm / 1000;
    const heightM = heightMm / 1000;
    const widthCm = Number((widthMm / 10).toFixed(1));
    const heightCm = Number((heightMm / 10).toFixed(1));
    const surfaceAreaSqM = Number((widthM * heightM).toFixed(4));
    const surfaceAreaSqFt = Number(((widthMm / 25.4 / 12) * (heightMm / 25.4 / 12)).toFixed(2));

    // Bays (Kalli) & Partitions & Shutters
    const bays = Math.max(1, parseInt(config.bays ?? config.cols) || 3);
    let partitions = 0;
    if (config.partitions !== undefined && config.partitions !== null) {
        partitions = Math.max(0, parseInt(config.partitions) || 0);
    } else if (config.panePartitions && Array.isArray(config.panePartitions)) {
        partitions = config.panePartitions.reduce((sum, p) => sum + (parseInt(p) || 0), 0);
    }
    const shuttersCount = (config.shuttersCount !== undefined && config.shuttersCount !== null)
        ? Math.max(0, parseInt(config.shuttersCount) || 0)
        : bays;

    // Rates from Store (Dynamic Catalog Rates)
    const fabRates = Store.state.fabricationRates || {};
    // Unit weight ratio: benchmark profile with 240mm sheet width yields approx. 0.875 kg per 300mm length (0.875 / 0.3 = 2.9167 kg/m)
    const unitWeightRatioKgPerM = parseFloat(config.unitWeightRatio ?? fabRates.unitWeightRatioKgPerMeter) || 2.9167;
    const profileKgRate = parseFloat(config.profileKgRate ?? fabRates.profileKgRate) || 180;
    const pipeMeterRate = parseFloat(config.pipeMeterRate ?? fabRates.pipeMeterRate) || 95;
    const grillPitchMm = parseFloat(config.grillPitchMm ?? fabRates.grillPitchMm) || 120;
    const holePunchRate = parseFloat(config.holePunchRate ?? fabRates.holePunchRate) || 5;
    const paintBaselineCost = parseFloat(config.paintBaselineCost ?? fabRates.paintBaselineCost) || 150;
    const paintBaselineAreaSqM = parseFloat(config.paintBaselineAreaSqM ?? fabRates.paintBaselineAreaSqM) || 0.70;
    const unitHingeRate = parseFloat(config.unitHingeRate ?? fabRates.unitHingeRate) || 85;

    // Base Labour Tiers
    const labourTiers = fabRates.labourTiers || {
        baseAssembly: 150,
        shutterFabrication: 150,
        partitionCharge: 50,
        cuttingHandlingSurcharge: 150
    };
    const baseAssemblyRate = parseFloat(config.labourBaseAssembly ?? labourTiers.baseAssembly) || 150;
    const shutterFabricationRate = parseFloat(config.labourShutterFabrication ?? labourTiers.shutterFabrication) || 150;
    const partitionInsertionRate = parseFloat(config.labourPartitionCharge ?? labourTiers.partitionCharge) || 50;
    const cuttingHandlingSurchargeRate = parseFloat(config.labourCuttingSurcharge ?? labourTiers.cuttingHandlingSurcharge) || 150;

    // 1. Outer Frame Profile
    // Perimeter = 2 * (Width + Height)
    const outerPerimeterM = Number((2 * (widthM + heightM)).toFixed(3));
    const outerWeightKg = Number((outerPerimeterM * unitWeightRatioKgPerM).toFixed(3));
    const outerProfileCost = Math.round(outerWeightKg * profileKgRate);

    // 2. Center / Mullion Inner Profiles
    // For a 3-bay window, count = 2 vertical center profiles (bays - 1)
    const mullionCount = Math.max(0, bays - 1);
    // Vertical center mullions length: count * height
    const mullionLengthM = Number((mullionCount * heightM).toFixed(3));
    // Intermediate horizontal transoms length (if any partitions added):
    const partitionDividersLengthM = partitions > 0 ? Number((partitions * (widthM / bays)).toFixed(3)) : 0;
    const totalInnerProfileLengthM = Number((mullionLengthM + partitionDividersLengthM).toFixed(3));
    const innerWeightKg = Number((totalInnerProfileLengthM * unitWeightRatioKgPerM).toFixed(3));
    const innerProfileCost = Math.round(innerWeightKg * profileKgRate);

    const totalProfileWeightKg = Number((outerWeightKg + innerWeightKg).toFixed(3));
    const totalProfileCost = outerProfileCost + innerProfileCost;

    // 3. Safety Grill Pipes
    // Total Pipes Count = Determined by height intervals (e.g. 160 cm -> 13 horizontal pipes)
    const calculatedPipesCount = Math.max(1, Math.round(heightMm / grillPitchMm));
    const totalPipesCount = (config.manualPipeCount !== undefined && config.manualPipeCount !== null && config.manualPipeCount !== '')
        ? Math.max(0, parseInt(config.manualPipeCount) || 0)
        : calculatedPipesCount;
    // Total Pipe Length (meters) = Total Pipes * Width
    const totalPipeLengthM = Number((totalPipesCount * widthM).toFixed(2));
    const pipeCost = Math.round(totalPipeLengthM * pipeMeterRate);

    // 4. Profile Punching / Holes
    // Total Hole Openings = Pipe Count * Total Intersecting Profile Faces
    // 2 outer frame faces + 2 faces per center mullion = 2 * bays faces (e.g., 2 + 4 = 6 faces; 13 * 6 = 78 holes)
    const intersectingProfileFaces = 2 + (mullionCount * 2);
    const totalHoles = totalPipesCount * intersectingProfileFaces;
    const punchingCost = Math.round(totalHoles * holePunchRate);

    // 5. Hinges Selection Logic
    // Height-based threshold per panel:
    // Height < 1.0 m: 2 hinges per panel
    // Height 1.0 m to 1.5 m: 3 hinges per panel
    // Height 1.5 m to 2.0 m: 4 hinges per panel
    // Extra Partition Added: Increment to 5 or 6 hinges accordingly
    let baseHingesPerPanel = 2;
    if (heightM < 1.0) {
        baseHingesPerPanel = 2;
    } else if (heightM <= 1.5) {
        baseHingesPerPanel = 3;
    } else if (heightM <= 2.0) {
        baseHingesPerPanel = 4;
    } else {
        baseHingesPerPanel = 5;
    }
    const partitionHingeIncrement = partitions === 1 ? 1 : (partitions > 1 ? 2 : 0);
    const hingesPerPanel = Math.min(6, baseHingesPerPanel + partitionHingeIncrement);
    const totalHingesCount = shuttersCount * hingesPerPanel;
    const hingesCost = Math.round(totalHingesCount * unitHingeRate);

    // 6. Paint & Finishing Consumption
    // Dynamic surface area calculation benchmarked at ₹150 baseline for 50x140 cm (0.7 m²), scalable dynamically
    const paintAreaRatio = surfaceAreaSqM / paintBaselineAreaSqM;
    const paintCost = Math.round(paintAreaRatio * paintBaselineCost);
    const paintRatePerSqM = Number((paintBaselineCost / paintBaselineAreaSqM).toFixed(2));
    // Calculated volume in liters (benchmark coverage ~7 m² per liter primer/finish)
    const paintLiters = Number((surfaceAreaSqM * (1 / 7)).toFixed(2));
    const paintLiterRate = Math.round((paintBaselineCost / paintBaselineAreaSqM) * 7);

    // 7. Locks, Handles & Ancillary Hardware
    const unitLockRate = parseFloat(config.unitLockRate ?? fabRates.unitLockRate ?? 0);
    const locksCost = Math.round(shuttersCount * unitLockRate);
    const ancillaryRate = parseFloat(config.ancillaryRate ?? fabRates.ancillaryRate ?? 0);
    const ancillaryCost = Math.round(outerPerimeterM * ancillaryRate);
    const totalHardwareCost = hingesCost + locksCost + ancillaryCost;

    // 8. Labour & Fabrication Charges (4-tier structure)
    // Base single-panel assembly: ₹150
    // Opening shutter/panel additional fabrication: ₹150
    // Partition insertion charge: ₹50 per partition
    // Additional cutting and material handling surcharge: ₹150
    const baseAssemblyCharge = baseAssemblyRate;
    const shutterFabricationCharge = shutterFabricationRate * shuttersCount;
    const partitionCharge = partitionInsertionRate * partitions;
    const cuttingHandlingCharge = cuttingHandlingSurchargeRate;
    const totalLabourCost = baseAssemblyCharge + shutterFabricationCharge + partitionCharge + cuttingHandlingCharge;

    // Optional Panel / Glass
    const panelItemRate = parseFloat(config.panelRate) || 0;
    const panelCost = panelItemRate > 0 ? Math.round(surfaceAreaSqFt * panelItemRate) : 0;

    // Total Material & Operations
    const totalMaterialCost = outerProfileCost + innerProfileCost + pipeCost + punchingCost + hingesCost + locksCost + ancillaryCost + paintCost + panelCost;
    const subtotalCost = totalMaterialCost + totalLabourCost;
    const profitMarginPercent = parseFloat(config.profitMarginPercent ?? 15) || 0;
    const profitAmount = Math.round(subtotalCost * (profitMarginPercent / 100));
    const grandTotal = subtotalCost + profitAmount;

    // Itemized Bill of Materials (BOM) Model
    const bomItems = [
        {
            category: 'Raw Materials',
            description: `Outer Frame Profile - Tata MS 16G Box Section (240mm Sheet Benchmark)`,
            spec: `Perimeter: ${outerPerimeterM}m (2 × [${widthM}m + ${heightM}m])`,
            quantity: outerWeightKg,
            unit: 'Kg',
            unitPrice: profileKgRate,
            unitPriceLabel: `₹${profileKgRate}/Kg`,
            totalCost: outerProfileCost,
            weightKg: outerWeightKg,
            lengthM: outerPerimeterM
        },
        ...(totalInnerProfileLengthM > 0 ? [{
            category: 'Raw Materials',
            description: `Center Mullion Profiles (${mullionCount} Vertical Mullions${partitions > 0 ? ` + ${partitions} Transoms` : ''})`,
            spec: `${mullionCount} Mullions (${mullionLengthM}m)${partitions > 0 ? ` + ${partitions} Transoms (${partitionDividersLengthM}m)` : ''} = ${totalInnerProfileLengthM}m total`,
            quantity: innerWeightKg,
            unit: 'Kg',
            unitPrice: profileKgRate,
            unitPriceLabel: `₹${profileKgRate}/Kg`,
            totalCost: innerProfileCost,
            weightKg: innerWeightKg,
            lengthM: totalInnerProfileLengthM
        }] : []),
        {
            category: 'Raw Materials',
            description: `Safety Grill Pipes - 20x20 Square Tubes (@ ${grillPitchMm}mm pitch)`,
            spec: `${totalPipesCount} horizontal pipes @ ${grillPitchMm}mm interval (${totalPipesCount} × ${widthM}m = ${totalPipeLengthM}m)`,
            quantity: totalPipeLengthM,
            unit: 'Mtr',
            unitPrice: pipeMeterRate,
            unitPriceLabel: `₹${pipeMeterRate}/Mtr`,
            totalCost: pipeCost,
            weightKg: Number((totalPipeLengthM * 0.95).toFixed(2)),
            count: totalPipesCount
        },
        ...(panelCost > 0 || (config.panelName && !config.panelIsNone) ? [{
            category: 'Raw Materials',
            description: `Sheet Panels / Glass Inserts (${config.panelName || '5mm Clear Float Glass / MS Sheet'})`,
            spec: `${surfaceAreaSqFt} sq.ft pane aperture area`,
            quantity: surfaceAreaSqFt,
            unit: 'Sq.Ft',
            unitPrice: panelItemRate,
            unitPriceLabel: `₹${panelItemRate}/Sq.Ft`,
            totalCost: panelCost,
            weightKg: Number((surfaceAreaSqFt * 1.15).toFixed(2))
        }] : []),
        {
            category: 'Hardware',
            description: `Heavy Duty Hinges (Height & Opening Logic: ${hingesPerPanel}/panel)`,
            spec: `${shuttersCount} panels × ${hingesPerPanel} hinges/panel (${shuttersCount * hingesPerPanel} nos total based on ${heightM.toFixed(2)}m H${partitions > 0 ? ` + ${partitionHingeIncrement} partition threshold` : ''})`,
            quantity: totalHingesCount,
            unit: 'Nos',
            unitPrice: unitHingeRate,
            unitPriceLabel: `₹${unitHingeRate}/No`,
            totalCost: hingesCost,
            weightKg: Number((totalHingesCount * 0.18).toFixed(2))
        },
        {
            category: 'Hardware',
            description: `Cockspur Window Handle Locks / Fasteners (${shuttersCount} Openings)`,
            spec: `${shuttersCount} shutter openings × 1 locking handle mechanism`,
            quantity: shuttersCount,
            unit: 'Nos',
            unitPrice: unitLockRate,
            unitPriceLabel: unitLockRate > 0 ? `₹${unitLockRate}/No` : 'Included',
            totalCost: locksCost,
            weightKg: Number((shuttersCount * 0.25).toFixed(2))
        },
        {
            category: 'Hardware',
            description: 'Ancillary Hardware (EPDM Weather Gasket & SS Assembly Screws)',
            spec: `${outerPerimeterM}m perimeter acoustic/weather seal & fasteners`,
            quantity: outerPerimeterM,
            unit: 'Mtr',
            unitPrice: ancillaryRate,
            unitPriceLabel: ancillaryRate > 0 ? `₹${ancillaryRate}/Mtr` : 'Standard',
            totalCost: ancillaryCost,
            weightKg: Number((outerPerimeterM * 0.05).toFixed(2))
        },
        {
            category: 'Operations',
            description: `Profile Hole Punching Operations (${totalPipesCount} pipes × ${intersectingProfileFaces} faces)`,
            spec: `${totalHoles} CNC/hydraulic punch openings (2 outer frame + ${mullionCount * 2} inner mullion faces)`,
            quantity: totalHoles,
            unit: 'Holes',
            unitPrice: holePunchRate,
            unitPriceLabel: `₹${holePunchRate}/Hole`,
            totalCost: punchingCost,
            weightKg: 0
        },
        {
            category: 'Consumables',
            description: `Paint & Finishing (Epoxy Powder Coating - Scaled Surface Coverage)`,
            spec: `${paintLiters} Ltr coating volume covering ${surfaceAreaSqM} m² (${surfaceAreaSqFt} sq.ft) surface area`,
            quantity: paintLiters,
            unit: 'Ltr',
            unitPrice: paintLiterRate,
            unitPriceLabel: `₹${paintLiterRate}/Ltr`,
            totalCost: paintCost,
            weightKg: Number((paintLiters * 1.2).toFixed(2))
        },
        {
            category: 'Labor',
            description: 'Base Single-Panel Assembly Labor (Structural Setup & Alignment)',
            spec: 'Base single-panel fabrication charge',
            quantity: 1,
            unit: 'Job',
            unitPrice: baseAssemblyCharge,
            unitPriceLabel: `₹${baseAssemblyCharge}/Job`,
            totalCost: baseAssemblyCharge,
            weightKg: 0
        },
        {
            category: 'Labor',
            description: `Opening Shutter Fabrication Labor (${shuttersCount} Shutters)`,
            spec: `${shuttersCount} opening shutters × ₹${shutterFabricationRate}/shutter`,
            quantity: shuttersCount,
            unit: 'Nos',
            unitPrice: shutterFabricationRate,
            unitPriceLabel: `₹${shutterFabricationRate}/No`,
            totalCost: shutterFabricationCharge,
            weightKg: 0
        },
        ...(partitions > 0 ? [{
            category: 'Labor',
            description: `Intermediate Partition Insertion Labor (${partitions} Partitions)`,
            spec: `${partitions} partitions × ₹${partitionInsertionRate}/partition`,
            quantity: partitions,
            unit: 'Nos',
            unitPrice: partitionInsertionRate,
            unitPriceLabel: `₹${partitionInsertionRate}/No`,
            totalCost: partitionCharge,
            weightKg: 0
        }] : []),
        {
            category: 'Labor',
            description: 'Material Handling & Cutting Surcharge',
            spec: 'Profile cutting, deburring & workshop material handling surcharge',
            quantity: 1,
            unit: 'Job',
            unitPrice: cuttingHandlingCharge,
            unitPriceLabel: `₹${cuttingHandlingCharge}/Job`,
            totalCost: cuttingHandlingCharge,
            weightKg: 0
        }
    ];

    const categorySubtotals = {
        'Raw Materials': bomItems.filter(i => i.category === 'Raw Materials').reduce((s, i) => s + i.totalCost, 0),
        'Hardware': bomItems.filter(i => i.category === 'Hardware').reduce((s, i) => s + i.totalCost, 0),
        'Operations': bomItems.filter(i => i.category === 'Operations').reduce((s, i) => s + i.totalCost, 0),
        'Consumables': bomItems.filter(i => i.category === 'Consumables').reduce((s, i) => s + i.totalCost, 0),
        'Labor': bomItems.filter(i => i.category === 'Labor').reduce((s, i) => s + i.totalCost, 0)
    };

    return {
        unit, rawW, rawH,
        widthMm, heightMm, widthM, heightM, widthCm, heightCm,
        surfaceAreaSqM, surfaceAreaSqFt,
        bays, mullionCount, partitions, shuttersCount,
        // Profile
        outerPerimeterM, unitWeightRatioKgPerM, outerWeightKg, outerProfileCost, profileKgRate,
        mullionLengthM, partitionDividersLengthM, totalInnerProfileLengthM, innerWeightKg, innerProfileCost,
        totalProfileWeightKg, totalProfileCost,
        // Grill Pipes
        grillPitchMm, calculatedPipesCount, totalPipesCount, totalPipeLengthM, pipeMeterRate, pipeCost,
        // Punching / Holes
        intersectingProfileFaces, totalHoles, holePunchRate, punchingCost,
        // Hinges & Hardware
        baseHingesPerPanel, partitionHingeIncrement, hingesPerPanel, totalHingesCount, unitHingeRate, hingesCost,
        unitLockRate, locksCost, ancillaryRate, ancillaryCost, totalHardwareCost,
        // Paint & Finishing
        paintBaselineCost, paintBaselineAreaSqM, paintAreaRatio, paintCost, paintRatePerSqM, paintLiters, paintLiterRate,
        // Panel
        panelCost, panelItemRate,
        // Labour
        baseAssemblyCharge, shutterFabricationCharge, partitionCharge, cuttingHandlingCharge, totalLabourCost,
        labourTiers: {
            baseAssembly: baseAssemblyRate,
            shutterFabrication: shutterFabricationRate,
            partitionCharge: partitionInsertionRate,
            cuttingHandlingSurcharge: cuttingHandlingSurchargeRate
        },
        // Complete BOM & Category Subtotals
        bomItems,
        categorySubtotals,
        // Totals
        totalMaterialCost, totalLabourCost, subtotalCost, profitMarginPercent, profitAmount, grandTotal
    };
}
window.calculateWindowFabrication = calculateWindowFabrication;

export function generateWindowCadSvg(config, options = {}) {
    if (!config) return '';
    const cols = Math.max(1, parseInt(config.cols) || 1);
    const totalW = parseFloat(config.width || config.totalW) || (cols * 50);
    const totalH = parseFloat(config.height || config.totalH) || 140;
    const unit = config.unit || 'cm';
    const totalWCm = convertUnit(totalW, unit, 'cm');
    const totalHCm = convertUnit(totalH, unit, 'cm');

    const paneWidths = (config.paneWidths && config.paneWidths.length === cols) 
        ? config.paneWidths 
        : Array(cols).fill(totalW / cols);
    const panePartitions = (config.panePartitions && config.panePartitions.length === cols) 
        ? config.panePartitions 
        : Array(cols).fill(0);
    const partitionPos = (config.partitionPos && config.partitionPos.length === cols) 
        ? config.partitionPos 
        : Array(cols).fill('top');
    const partitionDir = (config.partitionDir && config.partitionDir.length === cols)
        ? config.partitionDir
        : Array(cols).fill('horizontal');

    const panelId = config.panel || config.materials?.panel || 'glass_5mm_clear';
    const hasPanel = panelId !== 'none' && panelId !== '' && panelId !== false && panelId !== 'None';
    const frameId = config.frame || config.materials?.frame || 'prof_4x25';
    const is4x3 = String(frameId).toLowerCase().includes('4x3') || String(config.profileName || config.desc || '').toLowerCase().includes('4x3');

    const viewW = options.viewW || (options.isThumbnail ? 220 : 660);
    const viewH = options.viewH || (options.isThumbnail ? 160 : 380);
    const padX = options.isThumbnail ? 24 : 56;
    const padY = options.isThumbnail ? 18 : 46;
    const availW = viewW - (padX * 2);
    const availH = viewH - (padY * 2);

    const aspect = Math.max(0.15, Math.min(6, totalW / totalH));
    let drawW, drawH;
    if (aspect >= (availW / availH)) {
        drawW = availW;
        drawH = Math.max(options.isThumbnail ? 45 : 100, Math.round(drawW / aspect));
    } else {
        drawH = availH;
        drawW = Math.max(options.isThumbnail ? 35 : 80, Math.round(drawH * aspect));
    }

    const startX = Math.round(padX + (availW - drawW) / 2);
    const startY = Math.round(padY + (availH - drawH) / 2);

    // Profile thickness
    const baseThick = options.isThumbnail 
        ? (is4x3 ? 6.5 : 4.5) 
        : (is4x3 ? Math.max(14, Math.round(drawH * 0.052)) : Math.max(9, Math.round(drawH * 0.038)));
    const frameThick = Math.max(options.isThumbnail ? 4 : 8, Math.round(baseThick));
    const mullionThick = Math.max(options.isThumbnail ? 3 : 6, Math.round(frameThick * 0.72));
    const sashThick = Math.max(options.isThumbnail ? 2.5 : 5, Math.round(frameThick * 0.65));
    const sashGap = options.isThumbnail ? 1 : 1.5;

    const profileFill = '#4a4d52';
    const profileStroke = '#181a1b';
    const strokeW = options.isThumbnail ? 1 : 1.5;
    const glassFill = '#ffffff';

    // Solid outer frame body
    let svgContent = `<rect x="${startX}" y="${startY}" width="${drawW}" height="${drawH}" fill="${profileFill}" stroke="${profileStroke}" stroke-width="${strokeW * 1.2}" rx="1" />`;

    const innerStartY = startY + frameThick;
    const innerH = drawH - (frameThick * 2);
    const totalInnerW = drawW - (frameThick * 2) - ((cols - 1) * mullionThick);

    let currentX = startX + frameThick;
    let cadBestHorizDim = null;
    let cadBestVertDim = null;
    const panePositions = [];

    for (let i = 0; i < cols; i++) {
        const fraction = (paneWidths[i] && totalW > 0) ? (paneWidths[i] / totalW) : (1 / cols);
        const paneW = Math.max(5, Math.round(totalInnerW * fraction));
        const parts = panePartitions[i] || 0;
        const pos = partitionPos[i] || 'top';
        const isVert = parts >= 1 && ((partitionDir && partitionDir[i] === 'vertical') || pos === 'vertical');

        panePositions.push({ startX: currentX, endX: currentX + paneW, w: paneW, i });

        // Sub-sections in this pane
        const subSections = [];
        if (parts === 0) {
            subSections.push({ x: currentX, y: innerStartY, w: paneW, h: innerH, isVert: false });
        } else if (isVert) {
            let pxFrac = 0.50;
            if (pos === 'left') pxFrac = 0.35;
            else if (pos === 'right') pxFrac = 0.65;
            const w1 = Math.round((paneW - mullionThick) * pxFrac);
            const w2 = paneW - mullionThick - w1;
            subSections.push({ x: currentX, y: innerStartY, w: w1, h: innerH, isVert: true });
            subSections.push({ x: currentX + w1 + mullionThick, y: innerStartY, w: w2, h: innerH, isVert: true });
        } else if (parts === 1) {
            let pyFrac = 0.35;
            if (config.partitionHeights && config.partitionHeights[i]) {
                pyFrac = Math.max(0.1, Math.min(0.9, config.partitionHeights[i] / totalHCm));
            } else if (pos === 'quarter') {
                pyFrac = 0.25;
            } else if (pos === 'center') {
                pyFrac = 0.50;
            } else if (pos === 'bottom') {
                pyFrac = 0.65;
            } else if (pos === 'threequarter') {
                pyFrac = 0.75;
            }
            const h1 = Math.round((innerH - mullionThick) * pyFrac);
            const h2 = innerH - mullionThick - h1;
            subSections.push({ x: currentX, y: innerStartY, w: paneW, h: h1, isVert: false });
            subSections.push({ x: currentX, y: innerStartY + h1 + mullionThick, w: paneW, h: h2, isVert: false });
        } else {
            const hEach = Math.round((innerH - (parts * mullionThick)) / (parts + 1));
            for (let p = 0; p <= parts; p++) {
                subSections.push({ x: currentX, y: innerStartY + (p * (hEach + mullionThick)), w: paneW, h: hEach, isVert: false });
            }
        }

        // Render each opening (aperture cutout)
        for (let s = 0; s < subSections.length; s++) {
            const sec = subSections[s];
            let apX = sec.x;
            let apY = sec.y;
            let apW = sec.w;
            let apH = sec.h;

            if (hasPanel) {
                svgContent += `<rect x="${sec.x}" y="${sec.y}" width="${sec.w}" height="${sec.h}" fill="#ffffff" stroke="${profileStroke}" stroke-width="${strokeW}" />`;
                const sX = sec.x + sashGap;
                const sY = sec.y + sashGap;
                const sW = sec.w - (sashGap * 2);
                const sH = sec.h - (sashGap * 2);
                if (sW > sashThick * 2 && sH > sashThick * 2) {
                    svgContent += `<rect x="${sX}" y="${sY}" width="${sW}" height="${sH}" fill="${profileFill}" stroke="${profileStroke}" stroke-width="${strokeW}" />`;
                    const gX = sX + sashThick;
                    const gY = sY + sashThick;
                    const gW = sW - (sashThick * 2);
                    const gH = sH - (sashThick * 2);
                    svgContent += `<rect x="${gX}" y="${gY}" width="${gW}" height="${gH}" fill="${glassFill}" stroke="${profileStroke}" stroke-width="${strokeW * 0.8}" />`;
                    apX = gX; apY = gY; apW = gW; apH = gH;
                }
            } else {
                svgContent += `<rect x="${sec.x}" y="${sec.y}" width="${sec.w}" height="${sec.h}" fill="${glassFill}" stroke="${profileStroke}" stroke-width="${strokeW}" />`;
            }

            // Security Grill Tubes inside aperture (20x20 Square Tubes)
            const secW_cm = (sec.w / totalInnerW) * (totalW - (cols > 1 ? (cols - 1) * 2.5 : 0));
            const secH_cm = (sec.h / innerH) * totalH;
            const subKey = `${i}_${s}`;
            const paneOrient = (config.subOrientations && config.subOrientations[subKey]) || (config.paneTubeOrientations && config.paneTubeOrientations[i]) || config.grillOrientation || 'horizontal';
            const paneCount = (config.subTubeCounts && config.subTubeCounts[subKey]) ?? (config.paneTubeCounts ? config.paneTubeCounts[i] : null);
            const grill = computePaneGrill(secW_cm, secH_cm, paneOrient, paneCount);

            const pipeThickPx = Math.max(options.isThumbnail ? 2 : 3, Math.round(drawH * (2.0 / Math.max(20, totalH))));

            if (grill.count > 0 && apW > pipeThickPx * 2 && apH > pipeThickPx * 2) {
                if (paneOrient === 'horizontal') {
                    const gapPx = (apH - (grill.count * pipeThickPx)) / (grill.count + 1);
                    for (let p = 0; p < grill.count; p++) {
                        const py = apY + gapPx * (p + 1) + pipeThickPx * p;
                        svgContent += `<rect x="${apX}" y="${py}" width="${apW}" height="${pipeThickPx}" fill="#ffffff" stroke="#334155" stroke-width="${options.isThumbnail ? 0.8 : 1.1}" rx="0.5" />`;
                    }
                    const isPart = (panePartitions[i] > 0);
                    const isMainArea = isPart ? (s > 0) : true;
                    let hScore = apH;
                    if (isMainArea) hScore += 600;
                    if (i === cols - 1) hScore += 100;

                    if (!cadBestHorizDim || hScore > cadBestHorizDim.score) {
                        cadBestHorizDim = { apX, apY, apW, apH, gapPx, pipeThickPx, gapCm: grill.gapCm, i, s, score: hScore, count: grill.count };
                    }
                } else {
                    const gapPx = (apW - (grill.count * pipeThickPx)) / (grill.count + 1);
                    for (let p = 0; p < grill.count; p++) {
                        const px = apX + gapPx * (p + 1) + pipeThickPx * p;
                        svgContent += `<rect x="${px}" y="${apY}" width="${pipeThickPx}" height="${apH}" fill="#ffffff" stroke="#334155" stroke-width="${options.isThumbnail ? 0.8 : 1.1}" rx="0.5" />`;
                    }
                    if (!cadBestVertDim || s === 0) {
                        cadBestVertDim = { apX, apY, apW, apH, gapPx, pipeThickPx, gapCm: grill.gapCm, i, s, count: grill.count };
                    }
                }
            }
        }

        currentX += paneW + (i < cols - 1 ? mullionThick : 0);
    }

    // AutoCAD Dimensions & Blueprint Annotations (Matching User Reference Image 2)
    if (options.showDimensions && !options.isThumbnail) {
        const strokeCAD = '#94a3b8';
        const strokeW_CAD = 1.1;
        const fontFam = 'monospace';

        // 1. Top Dimensions: Individual Pane Widths (Image 2: 41, 100, 41)
        for (let pIdx = 0; pIdx < panePositions.length; pIdx++) {
            const pos = panePositions[pIdx];
            const pX1 = pos.startX;
            const pX2 = pos.endX;
            const dimY = startY - 16;
            const paneWCm = Math.round(convertUnit(paneWidths[pIdx] || (totalW / cols), unit, 'cm'));

            // Witness lines
            svgContent += `<line x1="${pX1}" y1="${startY}" x2="${pX1}" y2="${dimY - 5}" stroke="${strokeCAD}" stroke-width="0.9" />`;
            svgContent += `<line x1="${pX2}" y1="${startY}" x2="${pX2}" y2="${dimY - 5}" stroke="${strokeCAD}" stroke-width="0.9" />`;
            // Dimension line
            svgContent += `<line x1="${pX1}" y1="${dimY}" x2="${pX2}" y2="${dimY}" stroke="${strokeCAD}" stroke-width="${strokeW_CAD}" />`;
            // CAD 45° Tick marks
            svgContent += `<line x1="${pX1 - 3}" y1="${dimY + 3}" x2="${pX1 + 3}" y2="${dimY - 3}" stroke="${strokeCAD}" stroke-width="1.3" />`;
            svgContent += `<line x1="${pX2 - 3}" y1="${dimY + 3}" x2="${pX2 + 3}" y2="${dimY - 3}" stroke="${strokeCAD}" stroke-width="1.3" />`;
            // Centered dimension text
            svgContent += `<text x="${(pX1 + pX2) / 2}" y="${dimY - 4}" fill="#0f172a" font-size="10.5px" font-weight="700" font-family="${fontFam}" text-anchor="middle">${paneWCm}</text>`;
        }

        // 2. Bottom Dimension: Total Window Width (Image 2: 200)
        const botDimY = startY + drawH + 20;
        const totWCm = Math.round(totalWCm);
        svgContent += `
            <line x1="${startX}" y1="${startY + drawH}" x2="${startX}" y2="${botDimY + 6}" stroke="${strokeCAD}" stroke-width="0.9" />
            <line x1="${startX + drawW}" y1="${startY + drawH}" x2="${startX + drawW}" y2="${botDimY + 6}" stroke="${strokeCAD}" stroke-width="0.9" />
            <line x1="${startX}" y1="${botDimY}" x2="${startX + drawW}" y2="${botDimY}" stroke="${strokeCAD}" stroke-width="${strokeW_CAD}" />
            <line x1="${startX - 3}" y1="${botDimY + 3}" x2="${startX + 3}" y2="${botDimY - 3}" stroke="${strokeCAD}" stroke-width="1.4" />
            <line x1="${startX + drawW - 3}" y1="${botDimY + 3}" x2="${startX + drawW + 3}" y2="${botDimY - 3}" stroke="${strokeCAD}" stroke-width="1.4" />
            <text x="${startX + drawW / 2}" y="${botDimY + 14}" fill="#0f172a" font-size="12px" font-weight="800" font-family="${fontFam}" text-anchor="middle">${totWCm}</text>
        `;

        // 3. Right Dimension: Total Window Height (Image 2: 160)
        const rightDimX = startX + drawW + 22;
        const totHCm = Math.round(totalHCm);
        svgContent += `
            <line x1="${startX + drawW}" y1="${startY}" x2="${rightDimX + 6}" y2="${startY}" stroke="${strokeCAD}" stroke-width="0.9" />
            <line x1="${startX + drawW}" y1="${startY + drawH}" x2="${rightDimX + 6}" y2="${startY + drawH}" stroke="${strokeCAD}" stroke-width="0.9" />
            <line x1="${rightDimX}" y1="${startY}" x2="${rightDimX}" y2="${startY + drawH}" stroke="${strokeCAD}" stroke-width="${strokeW_CAD}" />
            <line x1="${rightDimX - 3}" y1="${startY + 3}" x2="${rightDimX + 3}" y2="${startY - 3}" stroke="${strokeCAD}" stroke-width="1.4" />
            <line x1="${rightDimX - 3}" y1="${startY + drawH + 3}" x2="${rightDimX + 3}" y2="${startY + drawH - 3}" stroke="${strokeCAD}" stroke-width="1.4" />
            <text x="${rightDimX + 8}" y="${startY + drawH / 2 + 4}" fill="#0f172a" font-size="12px" font-weight="800" font-family="${fontFam}" text-anchor="start">${totHCm}</text>
        `;

        // 4. Left Dimension: Partition Heights (Panel Outer-to-Outer / Poli)
        const horizPartIdx = panePartitions.findIndex((p, idx) => p > 0 && partitionDir[idx] !== 'vertical');
        const leftDimX = startX - 22;
        if (horizPartIdx !== -1) {
            let pyFrac = 0.35;
            if (config.partitionHeights && config.partitionHeights[horizPartIdx]) {
                pyFrac = Math.max(0.1, Math.min(0.9, config.partitionHeights[horizPartIdx] / totHCm));
            } else {
                const hPos = partitionPos[horizPartIdx] || 'top';
                if (hPos === 'quarter') pyFrac = 0.25;
                else if (hPos === 'center') pyFrac = 0.50;
                else if (hPos === 'bottom') pyFrac = 0.65;
                else if (hPos === 'threequarter') pyFrac = 0.75;
                else pyFrac = 0.35;
            }
            const topPanelH_px = Math.round((innerH - mullionThick) * pyFrac);
            const panelTopY = innerStartY;
            const divTopY = innerStartY + topPanelH_px;
            const divBottomY = divTopY + mullionThick;
            const panelBottomY = innerStartY + innerH;

            const topHCm = config.partitionHeights?.[horizPartIdx] ? Math.round(config.partitionHeights[horizPartIdx]) : Math.round(totHCm * pyFrac);
            const botHCm = Math.max(1, totHCm - topHCm);

            svgContent += `
                <!-- Top Panel (Poli) Outer-to-Outer -->
                <line x1="${startX}" y1="${panelTopY}" x2="${leftDimX - 6}" y2="${panelTopY}" stroke="${strokeCAD}" stroke-width="0.9" />
                <line x1="${startX}" y1="${divTopY}" x2="${leftDimX - 6}" y2="${divTopY}" stroke="${strokeCAD}" stroke-width="0.9" />
                <line x1="${leftDimX}" y1="${panelTopY}" x2="${leftDimX}" y2="${divTopY}" stroke="${strokeCAD}" stroke-width="${strokeW_CAD}" />
                <line x1="${leftDimX - 3}" y1="${panelTopY + 3}" x2="${leftDimX + 3}" y2="${panelTopY - 3}" stroke="${strokeCAD}" stroke-width="1.4" />
                <line x1="${leftDimX - 3}" y1="${divTopY + 3}" x2="${leftDimX + 3}" y2="${divTopY - 3}" stroke="${strokeCAD}" stroke-width="1.4" />
                <text x="${leftDimX - 8}" y="${(panelTopY + divTopY) / 2 + 4}" fill="#0f172a" font-size="11px" font-weight="700" font-family="${fontFam}" text-anchor="end">${topHCm}</text>

                <!-- Bottom Panel (Poli) Outer-to-Outer -->
                <line x1="${startX}" y1="${divBottomY}" x2="${leftDimX - 6}" y2="${divBottomY}" stroke="${strokeCAD}" stroke-width="0.9" />
                <line x1="${startX}" y1="${panelBottomY}" x2="${leftDimX - 6}" y2="${panelBottomY}" stroke="${strokeCAD}" stroke-width="0.9" />
                <line x1="${leftDimX}" y1="${divBottomY}" x2="${leftDimX}" y2="${panelBottomY}" stroke="${strokeCAD}" stroke-width="${strokeW_CAD}" />
                <line x1="${leftDimX - 3}" y1="${divBottomY + 3}" x2="${leftDimX + 3}" y2="${divBottomY - 3}" stroke="${strokeCAD}" stroke-width="1.4" />
                <line x1="${leftDimX - 3}" y1="${panelBottomY + 3}" x2="${leftDimX + 3}" y2="${panelBottomY - 3}" stroke="${strokeCAD}" stroke-width="1.4" />
                <text x="${leftDimX - 8}" y="${(divBottomY + panelBottomY) / 2 + 4}" fill="#0f172a" font-size="11px" font-weight="700" font-family="${fontFam}" text-anchor="end">${botHCm}</text>
            `;
        } else {
            svgContent += `
                <line x1="${startX}" y1="${startY}" x2="${leftDimX - 6}" y2="${startY}" stroke="${strokeCAD}" stroke-width="0.9" />
                <line x1="${startX}" y1="${startY + drawH}" x2="${leftDimX - 6}" y2="${startY + drawH}" stroke="${strokeCAD}" stroke-width="0.9" />
                <line x1="${leftDimX}" y1="${startY}" x2="${leftDimX}" y2="${startY + drawH}" stroke="${strokeCAD}" stroke-width="${strokeW_CAD}" />
                <line x1="${leftDimX - 3}" y1="${startY + 3}" x2="${leftDimX + 3}" y2="${startY - 3}" stroke="${strokeCAD}" stroke-width="1.4" />
                <line x1="${leftDimX - 3}" y1="${startY + drawH + 3}" x2="${leftDimX + 3}" y2="${startY + drawH - 3}" stroke="${strokeCAD}" stroke-width="1.4" />
                <text x="${leftDimX - 8}" y="${startY + drawH / 2 + 4}" fill="#0f172a" font-size="11px" font-weight="700" font-family="${fontFam}" text-anchor="end">${totHCm}</text>
            `;
        }

        // 5. Grill Gap Dimensions inside apertures (Image 2: 7.8)
        if (cadBestVertDim && cadBestVertDim.gapCm > 0) {
            const p = Math.max(0, Math.floor(((cadBestVertDim.count || 2) - 1) / 2));
            const x1 = cadBestVertDim.apX + cadBestVertDim.gapPx * (p + 1) + cadBestVertDim.pipeThickPx * p;
            const x2 = x1 + cadBestVertDim.gapPx;
            const midY = cadBestVertDim.apY + cadBestVertDim.apH / 2;
            svgContent += `
                <line x1="${x1}" y1="${midY}" x2="${x2}" y2="${midY}" stroke="#16a34a" stroke-width="1.2" />
                <line x1="${x1}" y1="${midY - 4}" x2="${x1}" y2="${midY + 4}" stroke="#16a34a" stroke-width="1.1" />
                <line x1="${x2}" y1="${midY - 4}" x2="${x2}" y2="${midY + 4}" stroke="#16a34a" stroke-width="1.1" />
                <text x="${(x1 + x2) / 2}" y="${midY - 5}" fill="#16a34a" font-size="10px" font-weight="700" font-family="${fontFam}" text-anchor="middle">${cadBestVertDim.gapCm}</text>
            `;
        }
        if (cadBestHorizDim && cadBestHorizDim.gapCm > 0) {
            const p = Math.max(0, Math.floor(((cadBestHorizDim.count || 2) - 1) / 2));
            const y1 = cadBestHorizDim.apY + cadBestHorizDim.gapPx * (p + 1) + cadBestHorizDim.pipeThickPx * p;
            const y2 = y1 + cadBestHorizDim.gapPx;
            const midX = cadBestHorizDim.apX + cadBestHorizDim.apW / 2;
            svgContent += `
                <line x1="${midX}" y1="${y1}" x2="${midX}" y2="${y2}" stroke="#16a34a" stroke-width="1.2" />
                <line x1="${midX - 4}" y1="${y1}" x2="${midX + 4}" y2="${y1}" stroke="#16a34a" stroke-width="1.1" />
                <line x1="${midX - 4}" y1="${y2}" x2="${midX + 4}" y2="${y2}" stroke="#16a34a" stroke-width="1.1" />
                <text x="${midX + 7}" y="${(y1 + y2) / 2 + 3.5}" fill="#16a34a" font-size="10px" font-weight="700" font-family="${fontFam}" text-anchor="start">${cadBestHorizDim.gapCm}</text>
            `;
        }
    } else if (options.showDimensions || options.isThumbnail) {
        // Thumbnail simplified badges
        const textH = options.isThumbnail ? '8.5px' : '11px';
        const boxH = options.isThumbnail ? 15 : 22;
        const boxW = options.isThumbnail ? 34 : 48;
        const leftBoxX = Math.max(2, startX - boxW - (options.isThumbnail ? 4 : 8));
        const leftBoxY = Math.round(startY + (drawH - boxH) / 2);
        svgContent += `
            <rect x="${leftBoxX}" y="${leftBoxY}" width="${boxW}" height="${boxH}" rx="3" fill="#ffffff" stroke="${profileStroke}" stroke-width="1.1" />
            <text x="${leftBoxX + boxW/2}" y="${leftBoxY + boxH/2 + (options.isThumbnail ? 3 : 3.5)}" fill="#0f172a" font-size="${textH}" font-weight="700" font-family="sans-serif" text-anchor="middle">${totalH}</text>
        `;

        const botBoxX = Math.round(startX + (drawW - boxW) / 2);
        const botBoxY = Math.min(viewH - boxH - 2, startY + drawH + (options.isThumbnail ? 3 : 6));
        svgContent += `
            <rect x="${botBoxX}" y="${botBoxY}" width="${boxW}" height="${boxH}" rx="3" fill="#ffffff" stroke="${profileStroke}" stroke-width="1.1" />
            <text x="${botBoxX + boxW/2}" y="${botBoxY + boxH/2 + (options.isThumbnail ? 3 : 3.5)}" fill="#0f172a" font-size="${textH}" font-weight="700" font-family="sans-serif" text-anchor="middle">${totalW}</text>
        `;
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewW} ${viewH}" style="width: 100%; height: 100%; display: block;">${svgContent}</svg>`;
}
window.generateWindowCadSvg = generateWindowCadSvg;



// --- GLOBAL ACTIONS ---

window.calcSwitchTab = (tab) => {
    Store.state.calcTab = tab;
    Store.state.currentView = 'calculation';
    if (tab === 'quotes') {
        if (!Store.state.quoteStudio || !Store.state.quoteStudio.active) {
            window.startQuotationStudio();
            return;
        }
    }
    Store.notify();
};

window.updateDesign = (field, value) => {
    if (!Store.state.calcState) return;
    const s = Store.state.calcState;
    if (field.includes('.')) {
        const parts = field.split('.');
        let obj = s;
        for (let i = 0; i < parts.length - 1; i++) {
            obj = obj[parts[i]];
        }
        obj[parts[parts.length - 1]] = value === 'true' || value === 'false' ? (value === 'true') : (parseFloat(value) || value);
    } else {
        s[field] = value === 'true' || value === 'false' ? (value === 'true') : (parseFloat(value) || value);
    }
    Store.notify();
};

window.saveDesign = () => {
    const s = Store.state.calcState;
    alert(`Design Saved: Frame ${s.width}x${s.height}cm`);
};

// --- OPTIMIZER ACTIONS ---

function initOptimizerState() {
    if (!Store.state.optimizer) {
        Store.state.optimizer = {
            panels: [{ id: 1, length: 207, width: 24, qty: 15 }, { id: 2, length: 120, width: 24, qty: 5 }, { id: 3, length: 237, width: 24, qty: 15 }],
            stock: [{ id: 1, length: 244, width: 122, qty: 100 }], // 8x4 ft sheet approx
            bladeWidth: 0.4,
            results: null
        };
    }
}
window.optAddPanel = () => { Store.state.optimizer.panels.push({ id: Date.now(), length: 0, width: 0, qty: 1 }); Store.notify(); };
window.optDeletePanel = (id) => { Store.state.optimizer.panels = Store.state.optimizer.panels.filter(p => p.id !== id); Store.notify(); };
window.optUpdatePanel = (id, field, value) => { const item = Store.state.optimizer.panels.find(p => p.id === id); if (item) item[field] = parseFloat(value) || 0; };
window.optAddStock = () => { Store.state.optimizer.stock.push({ id: Date.now(), length: 244, width: 122, qty: 1 }); Store.notify(); };
window.optDeleteStock = (id) => { Store.state.optimizer.stock = Store.state.optimizer.stock.filter(s => s.id !== id); Store.notify(); };
window.optUpdateStock = (id, field, value) => { const item = Store.state.optimizer.stock.find(s => s.id === id); if (item) item[field] = parseFloat(value) || 0; };


// --- 2D GUILLOTINE PACKING LOGIC ---

window.optCalculate = () => {
    const { panels, stock, bladeWidth } = Store.state.optimizer;

    // 1. Flatten Panels into individual pieces to be cut
    let piecesToCut = [];
    panels.forEach(p => {
        for (let i = 0; i < p.qty; i++) {
            piecesToCut.push({
                id: p.id,
                w: p.length, // X-axis
                h: p.width,  // Y-axis
                area: p.length * p.width,
                label: `${p.length}x${p.width}`
            });
        }
    });

    // Sort pieces by area (descending) - Heuristic for better packing
    piecesToCut.sort((a, b) => b.h - a.h || b.w - a.w);

    let layouts = [];

    // 2. Process pieces until all are cut
    while (piecesToCut.length > 0) {

        // Find best fit stock (Simplified: First available type)
        let stockSheet = stock[0];
        if (!stockSheet) {
            alert("No Stock Defined!");
            return;
        }

        let layout = {
            stockId: stockSheet.id,
            stockW: stockSheet.length,
            stockH: stockSheet.width,
            placements: [],
            freeRects: [{ x: 0, y: 0, w: stockSheet.length, h: stockSheet.width }],
            wastedArea: 0
        };

        let piecesCurrentPass = [];

        for (let i = 0; i < piecesToCut.length; i++) {
            const piece = piecesToCut[i];
            const placement = findPlacement(piece, layout.freeRects, bladeWidth);

            if (placement) {
                piecesToCut.splice(i, 1);
                i--;

                layout.placements.push({
                    x: placement.x,
                    y: placement.y,
                    w: piece.w,
                    h: piece.h,
                    label: piece.label
                });
                piecesCurrentPass.push(piece);

                splitFreeRect(layout.freeRects, placement.freeRectIndex, placement.x, placement.y, piece.w, piece.h, bladeWidth);
            }
        }

        if (piecesCurrentPass.length > 0) {
            layouts.push(layout);
        } else {
            alert(`Error: Piece ${piecesToCut[0].label} is too large for stock ${stockSheet.length}x${stockSheet.width}!`);
            break;
        }
    }

    // 3. Calculate Stats
    layouts.forEach(l => {
        const usedArea = l.placements.reduce((sum, p) => sum + (p.w * p.h), 0);
        const totalArea = l.stockW * l.stockH;
        l.usedPct = Math.round((usedArea / totalArea) * 100);
        l.wastePct = 100 - l.usedPct;
    });

    Store.state.optimizer.results = layouts;
    Store.notify();
};

function findPlacement(piece, freeRects, kerf) {
    for (let i = 0; i < freeRects.length; i++) {
        const r = freeRects[i];
        if (piece.w <= r.w && piece.h <= r.h) {
            return { x: r.x, y: r.y, freeRectIndex: i, rotated: false };
        }
        // Optional: Rotation logic could appear here
    }
    return null;
}

function splitFreeRect(freeRects, usedRectIndex, px, py, pw, ph, kerf) {
    const r = freeRects[usedRectIndex];
    freeRects.splice(usedRectIndex, 1);

    const remW = r.w - pw - kerf;
    const remH = r.h - ph - kerf;

    // Guillotine Split: Right then Bottom
    if (remW > 0) {
        freeRects.push({ x: px + pw + kerf, y: py, w: remW, h: ph });
    }

    // Bottom strip (full width of original rect to minimize    // Standard Guillotine usually splits one way full across.
    // Let's preserve the "bottom" strip as the large piece.
    const bottomH = r.h - ph - kerf;
    if (bottomH > 0) {
        freeRects.push({ x: r.x, y: py + ph + kerf, w: r.w, h: bottomH });
    }
}

window.optShowPartDetail = (label, w, h, type) => {
    const area = (w * h) / 10000; // m2
    const modal = document.createElement('div');
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100vw';
    modal.style.height = '100vh';
    modal.style.background = 'rgba(0,0,0,0.6)';
    modal.style.backdropFilter = 'blur(4px)';
    modal.style.zIndex = '1000';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };

    modal.innerHTML = `
        <div class="glass-panel" style="background: white; color: #333; padding: 2rem; width: 300px; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.5); transform: scale(0.9); animation: popin 0.2s forwards;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
                <h3 style="margin:0; font-size:1.2rem; display:flex; gap:0.5rem; align-items:center;">
                    <i data-lucide="${type === 'Waste' ? 'trash-2' : 'box'}" style="color:${type === 'Waste' ? '#d32f2f' : '#2e7d32'}"></i>
                    ${type} Detail
                </h3>
                <button onclick="this.closest('div').parentElement.parentElement.remove()" style="background:none; border:none; cursor:pointer;"><i data-lucide="x" style="color:#999"></i></button>
            </div>
            
            <div style="background: #f5f5f5; padding: 1.5rem; border-radius: 8px; text-align: center; margin-bottom: 1.5rem;">
                <div style="font-size: 2rem; font-weight: 700; color: #333;">${w} x ${h} <span style="font-size:1rem; font-weight:400; color:#666;">cm</span></div>
                <div style="margin-top: 0.5rem; color: #666; font-size: 0.9rem;">Label: <strong>${label}</strong></div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; font-size: 0.9rem;">
                <div style="background: #fff; border: 1px solid #eee; padding: 0.8rem; border-radius: 6px;">
                    <span style="display:block; color:#999; font-size:0.7rem; text-transform:uppercase;">Area</span>
                    <strong>${area.toFixed(3)} m²</strong>
                </div>
                 <div style="background: #fff; border: 1px solid #eee; padding: 0.8rem; border-radius: 6px;">
                    <span style="display:block; color:#999; font-size:0.7rem; text-transform:uppercase;">Type</span>
                    <strong style="color:${type === 'Waste' ? '#d32f2f' : '#2e7d32'}">${type}</strong>
                </div>
            </div>
            
            <button class="btn btn-primary" style="width:100%; margin-top:1.5rem;" onclick="this.closest('div').parentElement.parentElement.remove()">Close</button>
        </div>
        <style>@keyframes popin { to { transform: scale(1); } }</style>
    `;
    document.body.appendChild(modal);
    if (window.lucide && typeof window.lucide.createIcons === 'function') window.lucide.createIcons();
};

// --- MANUAL CALC ACTIONS (Restored) ---

function initManualState() {
    if (!Store.state.manualCalc) Store.state.manualCalc = { pipes: [], sheets: [] };
}
window.manualAddPipe = () => { Store.state.manualCalc.pipes.push({ id: Date.now(), profile: '1x1 Square', length: 0, qty: 1 }); Store.notify(); };
window.manualDeletePipe = (id) => { Store.state.manualCalc.pipes = Store.state.manualCalc.pipes.filter(i => i.id !== id); Store.notify(); };
window.manualUpdatePipe = (id, field, value) => { const item = Store.state.manualCalc.pipes.find(i => i.id === id); if (item) item[field] = field === 'profile' ? value : parseFloat(value) || 0; Store.notify(); };
window.manualAddSheet = () => { Store.state.manualCalc.sheets.push({ id: Date.now(), gauge: '18G', length: 0, width: 0, qty: 1 }); Store.notify(); };
window.manualDeleteSheet = (id) => { Store.state.manualCalc.sheets = Store.state.manualCalc.sheets.filter(i => i.id !== id); Store.notify(); };
window.manualUpdateSheet = (id, field, value) => { const item = Store.state.manualCalc.sheets.find(i => i.id === id); if (item) item[field] = field === 'gauge' ? value : parseFloat(value) || 0; Store.notify(); };



// --- SHARED UNIT CONVERTER (exported at top of file) ---

/* Duplicate generateWindowCadSvg merged with primary implementation */


// --- RENDER FUNCTIONS ---

export function renderCalculation(state) {
    const container = document.createElement('div');
    container.className = 'calculation-view animate-fade-in';
    container.style.position = 'absolute';
    container.style.top = '0';
    container.style.left = '0';
    container.style.right = '0';
    container.style.bottom = '0';
    container.style.display = 'flex';
    container.style.backgroundColor = 'var(--color-bg-main)';

    if (!state.calcTab || state.calcTab === 'detailed') state.calcTab = 'manual';
    initOptimizerState();

    const activeTab = state.calcTab || 'manual';

    container.innerHTML = `
        <!-- Studio Inner Sidebar -->
        <aside class="calculation-sidebar" style="width: 250px; background: var(--color-bg-surface-glass); border-right: 1px solid var(--glass-border); display: flex; flex-direction: column; flex-shrink: 0; padding: 1.25rem 0.85rem; backdrop-filter: blur(12px); z-index: 10;">
            <div style="padding: 0 0.5rem 1.1rem 0.5rem; border-bottom: 1px solid var(--glass-border); margin-bottom: 1rem;">
                <div style="font-size: 0.72rem; text-transform: uppercase; font-weight: 700; letter-spacing: 0.8px; color: var(--color-primary); display: flex; align-items: center; gap: 6px;">
                    <i data-lucide="compass" style="width: 14px; height: 14px;"></i> Estimation Studio
                </div>
                <div style="font-size: 1.05rem; font-weight: 700; color: var(--color-text-heading); margin-top: 2px;">
                    Window Studio
                </div>
            </div>

            <nav style="display: flex; flex-direction: column; gap: 0.4rem; flex: 1;">
                <button class="calc-nav-item ${activeTab === 'manual' ? 'active' : ''}" onclick="window.calcSwitchTab('manual')" id="tab-quick-calc">
                    <i data-lucide="calculator" style="width: 18px; height: 18px;"></i>
                    <div style="display: flex; flex-direction: column; text-align: left;">
                        <span style="font-weight: 600;">Quick Calculation</span>
                        <span style="font-size: 0.7rem; color: var(--color-text-muted); font-weight: 400;">2D Model & Materials</span>
                    </div>
                </button>

                <button class="calc-nav-item ${activeTab === 'quotes' ? 'active' : ''}" onclick="window.calcSwitchTab('quotes')" id="tab-quote-calc">
                    <i data-lucide="file-text" style="width: 18px; height: 18px;"></i>
                    <div style="display: flex; flex-direction: column; text-align: left;">
                        <span style="font-weight: 600;">Quotation Calculation</span>
                        <span style="font-size: 0.7rem; color: var(--color-text-muted); font-weight: 400;">Estimates & Client Quotes</span>
                    </div>
                </button>

                <button class="calc-nav-item ${activeTab === 'settings' ? 'active' : ''}" onclick="window.calcSwitchTab('settings')" id="tab-material-catalog">
                    <i data-lucide="layers" style="width: 18px; height: 18px;"></i>
                    <div style="display: flex; flex-direction: column; text-align: left;">
                        <span style="font-weight: 600;">Material Catalog</span>
                        <span style="font-size: 0.7rem; color: var(--color-text-muted); font-weight: 400;">Profiles & Rate Masters</span>
                    </div>
                </button>
            </nav>

            <div style="margin-top: auto; padding-top: 0.75rem; border-top: 1px solid var(--glass-border);">
                <button onclick="window.navigate('dashboard')" class="calc-nav-item" style="color: var(--color-text-muted); padding: 0.65rem 0.75rem;">
                    <i data-lucide="arrow-left" style="width: 16px; height: 16px;"></i>
                    <span>Exit to Dashboard</span>
                </button>
            </div>
        </aside>

        <!-- Studio Main Content Area -->
        <div style="flex: 1; display: flex; flex-direction: column; height: 100%; overflow: hidden; position: relative; background: radial-gradient(circle at top right, var(--color-primary-subtle), transparent 40%);">
            <header style="height: 64px; border-bottom: 1px solid var(--glass-border); background: var(--color-bg-surface-glass); padding: 0 2rem; display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; backdrop-filter: blur(10px);">
                <div>
                     <h2 style="font-size: 1.35rem; margin: 0; display:flex; align-items:center; gap:0.75rem; font-weight: 700; color: var(--color-text-heading);">
                        ${getTabIcon(state.calcTab)}
                        ${getTabTitle(state.calcTab)}
                     </h2>
                </div>
                <div style="display: flex; gap: 1rem; align-items: center;">
                    <div style="text-align: right;">
                        <div style="font-size: 0.85rem; font-weight: 600; color: var(--color-text-heading);">${(state.user && state.user.name) || 'Anshid'}</div>
                        <div style="font-size: 0.72rem; color: var(--color-text-muted);">${(state.user && state.user.role) || 'Admin'}</div>
                    </div>
                </div>
            </header>
            <div id="calc-content-scroll" style="flex: 1; overflow-y: auto; padding: 0;">
                <div id="calc-inner-mount" style="padding: 1.5rem; max-width: 1500px; margin: 0 auto; min-height: 100%;">
                    ${getTabContent(state)}
                </div>
            </div>
        </div>
    `;



    setTimeout(() => {
        if (window.lucide && typeof window.lucide.createIcons === 'function') {
            window.lucide.createIcons();
        }
    }, 10);

    return container;
}

function getTabTitle(tab) {
    if (tab === 'manual') return 'Quick Calculation';
    if (tab === 'quotes') return 'Quotation Calculation';
    if (tab === 'settings') return 'Material Catalog';
    if (tab === 'detailed') return 'Detailed Calculation';
    if (tab === 'designer') return 'Design Editor';
    if (tab === 'optimizer') return 'Cutting Optimizer';
    return 'Quick Calculation';
}

function getTabIcon(tab) {
    if (tab === 'manual') return '<i data-lucide="calculator" style="color:var(--color-primary)"></i>';
    if (tab === 'quotes') return '<i data-lucide="file-text" style="color:var(--color-primary)"></i>';
    if (tab === 'settings') return '<i data-lucide="layers" style="color:var(--color-primary)"></i>';
    if (tab === 'detailed') return '<i data-lucide="sliders" style="color:var(--color-primary)"></i>';
    if (tab === 'designer') return '<i data-lucide="pen-tool" style="color:var(--color-primary)"></i>';
    return '<i data-lucide="calculator" style="color:var(--color-primary)"></i>';
}

function getTabContent(state) {
    if (state.calcTab === 'quotes') {
        if (!Store.state.quoteStudio || !Store.state.quoteStudio.active) {
            window.startQuotationStudio();
        }
        return renderQuotationStudio(state);
    }
    if (!state.calcTab || state.calcTab === 'manual') return renderManualCalc(state);
    if (state.calcTab === 'settings') return renderMaterialCatalog(state);
    if (state.calcTab === 'detailed') return renderDetailedCalculation(state);
    if (state.calcTab === 'opt_panels') return renderOptPanels(state);
    if (state.calcTab === 'opt_stock') return renderOptStock(state);
    if (state.calcTab === 'opt_results') return renderOptResults(state);
    if (state.calcTab === 'designer') return renderDesigner(state);
    if (state.calcTab === 'quote_report') return renderQuoteReport(state);
    return renderManualCalc(state);
}


// Material Catalog UI State & Helpers
window.matCatalogActiveGroup = window.matCatalogActiveGroup || 'all';
window.matCatalogSearchQuery = window.matCatalogSearchQuery || '';
window.matCatalogViewMode = window.matCatalogViewMode || 'columns';

export function renderMaterialCatalog(state) {
    // Purge legacy 'Frame' category and migrate any existing items to Profile
    if (Store.state.materialGroups) {
        Store.state.materialGroups = Store.state.materialGroups.filter(g => g && g.toLowerCase() !== 'frame');
    }
    const catalog = Store.state.materialCatalog || [];
    catalog.forEach(m => {
        if ((m.category || '').toLowerCase() === 'frame') m.category = 'Profile';
    });

    const groups = (Store.state.materialGroups || ['Profile', 'Pipe', 'Panel', 'Hinges', 'Paint', 'Lock & Accessories', 'Hook & Rubber']).filter(g => g && g.toLowerCase() !== 'frame');
    
    // Group icons & colors mapping
    const groupMeta = {
        'Profile': { icon: 'box', color: '#3b82f6' },
        'Pipe': { icon: 'columns', color: '#06b6d4' },
        'Panel': { icon: 'layout-grid', color: '#8b5cf6' },
        'Hinges': { icon: 'shuffle', color: '#f59e0b' },
        'Paint': { icon: 'paint-bucket', color: '#ec4899' },
        'Lock & Accessories': { icon: 'lock', color: '#ef4444' },
        'Hook & Rubber': { icon: 'anchor', color: '#10b981' }
    };
    const defaultMeta = { icon: 'folder', color: '#14b8a6' };

    let activeGroup = window.matCatalogActiveGroup || 'all';
    if (activeGroup.toLowerCase() === 'frame') {
        activeGroup = 'all';
        window.matCatalogActiveGroup = 'all';
    }
    const searchQuery = (window.matCatalogSearchQuery || '').toLowerCase().trim();
    const viewMode = window.matCatalogViewMode || 'columns';

    // Filter items
    const filteredCatalog = catalog.filter(item => {
        const itemCategory = (item.category || '').toLowerCase();
        const matchesGroup = activeGroup === 'all' || itemCategory === activeGroup.toLowerCase();
        if (!matchesGroup) return false;

        if (searchQuery) {
            const name = (item.name || '').toLowerCase();
            const desc = (item.description || '').toLowerCase();
            const cat = (item.category || '').toLowerCase();
            const unit = (item.unit || '').toLowerCase();
            const rate = String(item.rate || '');
            const thick = String(item.thicknessGauge || item.thicknessMm || item.thickness || '').toLowerCase();
            const width = String(item.sideWidthMm || item.widthMm || item.width || '').toLowerCase();
            return name.includes(searchQuery) || desc.includes(searchQuery) || cat.includes(searchQuery) || unit.includes(searchQuery) || rate.includes(searchQuery) || thick.includes(searchQuery) || width.includes(searchQuery);
        }
        return true;
    });

    // Groups to display in Columns view
    const displayGroups = (activeGroup === 'all' 
        ? groups 
        : groups.filter(g => g.toLowerCase() === activeGroup.toLowerCase())
    ).filter(g => g && g.toLowerCase() !== 'frame');

    // Schedule Lucide icons refresh
    setTimeout(() => { if (window.lucide) window.lucide.createIcons(); }, 20);

    return `
        <div style="height: 100%; overflow-y: auto; padding: 1.5rem 2rem; display: flex; flex-direction: column; gap: 1.5rem;">
            <!-- Header Card (Clean layout with ONLY 2 buttons at top right: Add Item and Add Category) -->
            <div class="glass-panel" style="padding: 1.25rem 1.75rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; border-radius: 12px; border: 1px solid var(--glass-border); background: var(--color-bg-surface-glass);">
                <div style="display: flex; align-items: center; gap: 0.9rem;">
                    <div style="width: 44px; height: 44px; border-radius: 10px; background: rgba(59, 130, 246, 0.15); display: flex; align-items: center; justify-content: center; color: #3b82f6; border: 1px solid rgba(59, 130, 246, 0.3);">
                        <i data-lucide="layers" style="width: 22px; height: 22px;"></i>
                    </div>
                    <div>
                        <h2 style="margin: 0; font-size: 1.35rem; font-weight: 700; color: var(--color-text-heading); display: flex; align-items: center; gap: 0.5rem;">
                            Material Catalog
                        </h2>
                        <p style="margin: 2px 0 0; font-size: 0.82rem; color: var(--color-text-muted);">
                            Profiles, pipes, panels, hinges, paint & hardware category rate masters.
                        </p>
                    </div>
                </div>
                <!-- STRICTLY ONLY TWO CALLS / BUTTONS AT TOP RIGHT -->
                <div style="display: flex; align-items: center; gap: 0.65rem;">
                    <button onclick="window.openAddMaterialModal()" class="btn btn-primary" id="btn-catalog-add-item" style="display: flex; align-items: center; gap: 0.45rem; padding: 0.55rem 1.15rem; font-size: 0.88rem; font-weight: 600;">
                        <i data-lucide="plus-circle" style="width: 16px; height: 16px;"></i> + Add Item
                    </button>
                    <button onclick="window.openAddCategoryModal()" class="btn btn-secondary" id="btn-catalog-add-category" style="display: flex; align-items: center; gap: 0.45rem; padding: 0.55rem 1rem; font-size: 0.88rem; border-color: rgba(255,255,255,0.25);">
                        <i data-lucide="folder-plus" style="width: 16px; height: 16px;"></i> + Add Category
                    </button>
                </div>
            </div>

            <!-- Window Fabrication Engineering & Material Rates Master (Formulas & Labour Tiers from Specifications) -->
            <div class="glass-panel" style="padding: 1.25rem 1.6rem; border-radius: 12px; border: 1.5px solid var(--glass-border); background: var(--color-bg-surface-glass); box-shadow: 0 4px 16px rgba(0,0,0,0.06); display: flex; flex-direction: column; gap: 1rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--glass-border); padding-bottom: 0.75rem; flex-wrap: wrap; gap: 0.75rem;">
                    <div style="display: flex; align-items: center; gap: 0.85rem;">
                        <div style="width: 40px; height: 40px; border-radius: 8px; background: rgba(56, 189, 248, 0.15); border: 1px solid rgba(56, 189, 248, 0.35); display: flex; align-items: center; justify-content: center; color: #38bdf8; flex-shrink: 0;">
                            <i data-lucide="sliders" style="width: 20px; height: 20px;"></i>
                        </div>
                        <div>
                            <div style="font-weight: 700; color: var(--color-text-heading); font-size: 1.05rem; display: flex; align-items: center; gap: 8px;">
                                Fabrication Engineering Rates & Base Labour Tiers Master
                                <span style="font-size: 0.68rem; background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; padding: 2px 8px; border-radius: 4px; font-weight: 800;">ENGINEERING FORMULAS</span>
                            </div>
                            <div style="font-size: 0.76rem; color: var(--color-text-muted); margin-top: 2px;">
                                Dynamic catalog unit prices for Outer & Inner Profiles, Pipes, Punching, Paint, and Base Labour Tiers. Changes immediately take effect in all window calculations.
                            </div>
                        </div>
                    </div>
                    <button type="button" onclick="window.openFabricationRatesModal()" class="btn btn-secondary" style="font-size: 0.80rem; padding: 5px 12px; display: flex; align-items: center; gap: 6px;">
                        <i data-lucide="settings" style="width: 14px; height: 14px;"></i> Edit Full Matrix
                    </button>
                </div>

                <!-- Live Master Rates Grid -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;">
                    <!-- 1. Profile Price / kg -->
                    <div style="background: var(--color-bg-card); padding: 8px 12px; border-radius: 8px; border: 1px solid var(--glass-border); display: flex; flex-direction: column; gap: 4px;">
                        <span style="font-size: 0.72rem; color: var(--color-text-muted); font-weight: 700;">PROFILE RATE (₹ / KG)</span>
                        <div style="display: flex; align-items: center; gap: 6px;">
                            <span style="font-weight: 800; color: #38bdf8;">₹</span>
                            <input type="number" step="1" value="${(Store.state.fabricationRates?.profileKgRate ?? 180)}" onchange="window.updateFabricationFormulaRate('profileKgRate', this.value)" style="width: 100%; height: 28px; font-weight: 800; background: var(--color-bg-input, #0f172a); color: var(--color-text-heading, white); border: 1px solid #38bdf8; border-radius: 4px; padding: 2px 6px; font-size: 0.88rem;">
                        </div>
                        <span style="font-size: 0.65rem; color: #64748b;">Weight: ${(Store.state.fabricationRates?.unitWeightRatioKgPerMeter ?? 2.9167).toFixed(4)} kg/m</span>
                    </div>

                    <!-- 2. Pipe Price / meter -->
                    <div style="background: var(--color-bg-card); padding: 8px 12px; border-radius: 8px; border: 1px solid var(--glass-border); display: flex; flex-direction: column; gap: 4px;">
                        <span style="font-size: 0.72rem; color: var(--color-text-muted); font-weight: 700;">PIPE RATE (₹ / METER)</span>
                        <div style="display: flex; align-items: center; gap: 6px;">
                            <span style="font-weight: 800; color: #06b6d4;">₹</span>
                            <input type="number" step="1" value="${(Store.state.fabricationRates?.pipeMeterRate ?? 95)}" onchange="window.updateFabricationFormulaRate('pipeMeterRate', this.value)" style="width: 100%; height: 28px; font-weight: 800; background: var(--color-bg-input, #0f172a); color: var(--color-text-heading, white); border: 1px solid #06b6d4; border-radius: 4px; padding: 2px 6px; font-size: 0.88rem;">
                        </div>
                        <span style="font-size: 0.65rem; color: #64748b;">Interval pitch: ${(Store.state.fabricationRates?.grillPitchMm ?? 120)}mm</span>
                    </div>

                    <!-- 3. Hole Punching Charge / hole -->
                    <div style="background: var(--color-bg-card); padding: 8px 12px; border-radius: 8px; border: 1px solid var(--glass-border); display: flex; flex-direction: column; gap: 4px;">
                        <span style="font-size: 0.72rem; color: var(--color-text-muted); font-weight: 700;">HOLE PUNCHING (₹ / HOLE)</span>
                        <div style="display: flex; align-items: center; gap: 6px;">
                            <span style="font-weight: 800; color: #f59e0b;">₹</span>
                            <input type="number" step="0.5" value="${(Store.state.fabricationRates?.holePunchRate ?? 5)}" onchange="window.updateFabricationFormulaRate('holePunchRate', this.value)" style="width: 100%; height: 28px; font-weight: 800; background: var(--color-bg-input, #0f172a); color: var(--color-text-heading, white); border: 1px solid #f59e0b; border-radius: 4px; padding: 2px 6px; font-size: 0.88rem;">
                        </div>
                        <span style="font-size: 0.65rem; color: #64748b;">Pipes × Intersecting Faces</span>
                    </div>

                    <!-- 4. Paint Baseline Cost -->
                    <div style="background: var(--color-bg-card); padding: 8px 12px; border-radius: 8px; border: 1px solid var(--glass-border); display: flex; flex-direction: column; gap: 4px;">
                        <span style="font-size: 0.72rem; color: var(--color-text-muted); font-weight: 700;">PAINT BASE (₹ / 0.7M²)</span>
                        <div style="display: flex; align-items: center; gap: 6px;">
                            <span style="font-weight: 800; color: #ec4899;">₹</span>
                            <input type="number" step="5" value="${(Store.state.fabricationRates?.paintBaselineCost ?? 150)}" onchange="window.updateFabricationFormulaRate('paintBaselineCost', this.value)" style="width: 100%; height: 28px; font-weight: 800; background: var(--color-bg-input, #0f172a); color: var(--color-text-heading, white); border: 1px solid #ec4899; border-radius: 4px; padding: 2px 6px; font-size: 0.88rem;">
                        </div>
                        <span style="font-size: 0.65rem; color: #64748b;">50x140 cm section baseline</span>
                    </div>

                    <!-- 5. Base Labour: Single-Panel Assembly -->
                    <div style="background: var(--color-bg-card); padding: 8px 12px; border-radius: 8px; border: 1px solid var(--glass-border); display: flex; flex-direction: column; gap: 4px;">
                        <span style="font-size: 0.72rem; color: var(--color-text-muted); font-weight: 700;">BASE ASSEMBLY (₹)</span>
                        <div style="display: flex; align-items: center; gap: 6px;">
                            <span style="font-weight: 800; color: #10b981;">₹</span>
                            <input type="number" step="10" value="${(Store.state.fabricationRates?.labourTiers?.baseAssembly ?? 150)}" onchange="window.updateLabourTierRate('baseAssembly', this.value)" style="width: 100%; height: 28px; font-weight: 800; background: var(--color-bg-input, #0f172a); color: var(--color-text-heading, white); border: 1px solid #10b981; border-radius: 4px; padding: 2px 6px; font-size: 0.88rem;">
                        </div>
                        <span style="font-size: 0.65rem; color: #64748b;">Single-panel base</span>
                    </div>

                    <!-- 6. Shutter Fabrication -->
                    <div style="background: var(--color-bg-card); padding: 8px 12px; border-radius: 8px; border: 1px solid var(--glass-border); display: flex; flex-direction: column; gap: 4px;">
                        <span style="font-size: 0.72rem; color: var(--color-text-muted); font-weight: 700;">SHUTTER FAB. (₹ / PANEL)</span>
                        <div style="display: flex; align-items: center; gap: 6px;">
                            <span style="font-weight: 800; color: #10b981;">₹</span>
                            <input type="number" step="10" value="${(Store.state.fabricationRates?.labourTiers?.shutterFabrication ?? 150)}" onchange="window.updateLabourTierRate('shutterFabrication', this.value)" style="width: 100%; height: 28px; font-weight: 800; background: var(--color-bg-input, #0f172a); color: var(--color-text-heading, white); border: 1px solid #10b981; border-radius: 4px; padding: 2px 6px; font-size: 0.88rem;">
                        </div>
                        <span style="font-size: 0.65rem; color: #64748b;">Opening sash additional</span>
                    </div>

                    <!-- 7. Partition Insertion -->
                    <div style="background: var(--color-bg-card); padding: 8px 12px; border-radius: 8px; border: 1px solid var(--glass-border); display: flex; flex-direction: column; gap: 4px;">
                        <span style="font-size: 0.72rem; color: var(--color-text-muted); font-weight: 700;">PARTITION (₹ / PARTITION)</span>
                        <div style="display: flex; align-items: center; gap: 6px;">
                            <span style="font-weight: 800; color: #10b981;">₹</span>
                            <input type="number" step="5" value="${(Store.state.fabricationRates?.labourTiers?.partitionCharge ?? 50)}" onchange="window.updateLabourTierRate('partitionCharge', this.value)" style="width: 100%; height: 28px; font-weight: 800; background: var(--color-bg-input, #0f172a); color: var(--color-text-heading, white); border: 1px solid #10b981; border-radius: 4px; padding: 2px 6px; font-size: 0.88rem;">
                        </div>
                        <span style="font-size: 0.65rem; color: #64748b;">Transom / vertical divider</span>
                    </div>

                    <!-- 8. Cutting & Surcharge -->
                    <div style="background: var(--color-bg-card); padding: 8px 12px; border-radius: 8px; border: 1px solid var(--glass-border); display: flex; flex-direction: column; gap: 4px;">
                        <span style="font-size: 0.72rem; color: var(--color-text-muted); font-weight: 700;">CUTTING SURCHARGE (₹)</span>
                        <div style="display: flex; align-items: center; gap: 6px;">
                            <span style="font-weight: 800; color: #10b981;">₹</span>
                            <input type="number" step="10" value="${(Store.state.fabricationRates?.labourTiers?.cuttingHandlingSurcharge ?? 150)}" onchange="window.updateLabourTierRate('cuttingHandlingSurcharge', this.value)" style="width: 100%; height: 28px; font-weight: 800; background: var(--color-bg-input, #0f172a); color: var(--color-text-heading, white); border: 1px solid #10b981; border-radius: 4px; padding: 2px 6px; font-size: 0.88rem;">
                        </div>
                        <span style="font-size: 0.65rem; color: #64748b;">Handling & material prep</span>
                    </div>
                </div>
            </div>

            <!-- Controls: Filter Pills & Search & View Toggle -->
            <div style="display: flex; justify-content: space-between; align-items: center; gap: 1rem; flex-wrap: wrap;">
                <!-- Group Filter Pills -->
                <div style="display: flex; gap: 0.4rem; flex-wrap: wrap; background: rgba(0,0,0,0.25); padding: 5px; border-radius: 10px; border: 1px solid var(--glass-border); align-items: center;">
                    <button onclick="window.setCatalogFilter('all')" 
                            style="border: none; border-radius: 6px; padding: 5px 12px; font-size: 0.82rem; cursor: pointer; transition: all 0.2s; background: ${activeGroup === 'all' ? 'var(--color-primary)' : 'transparent'}; color: ${activeGroup === 'all' ? 'white' : 'var(--color-text-muted)'}; font-weight: ${activeGroup === 'all' ? '600' : '400'};">
                        All Items (${catalog.length})
                    </button>
                    ${groups.map(g => {
                        const cnt = catalog.filter(m => (m.category || '').toLowerCase() === g.toLowerCase()).length;
                        const isAct = activeGroup.toLowerCase() === g.toLowerCase();
                        const meta = groupMeta[g] || defaultMeta;
                        return `
                            <button onclick="window.setCatalogFilter('${g}')" 
                                    style="border: none; border-radius: 6px; padding: 5px 12px; font-size: 0.82rem; cursor: pointer; transition: all 0.2s; background: ${isAct ? meta.color : 'transparent'}; color: ${isAct ? 'white' : 'var(--color-text-muted)'}; font-weight: ${isAct ? '600' : '400'}; display: flex; align-items: center; gap: 5px;">
                                <i data-lucide="${meta.icon}" style="width: 13px; height: 13px;"></i>
                                ${g} (${cnt})
                            </button>
                        `;
                    }).join('')}
                </div>

                <!-- Search Input and View Switcher -->
                <div style="display: flex; align-items: center; gap: 0.75rem;">
                    <div style="position: relative; width: 280px;">
                        <i data-lucide="search" style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); width: 15px; height: 15px; color: #888;"></i>
                        <input type="text" placeholder="Search profiles, pipes, panels, specs..." value="${window.matCatalogSearchQuery || ''}" oninput="window.setCatalogSearch(this.value)" class="glass-input" style="width: 100%; padding-left: 32px; font-size: 0.84rem; height: 35px; border-radius: 8px;">
                        ${window.matCatalogSearchQuery ? `
                            <button onclick="window.setCatalogSearch('')" style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); background: none; border: none; color: #888; cursor: pointer; padding: 2px;">
                                <i data-lucide="x" style="width: 13px; height: 13px;"></i>
                            </button>
                        ` : ''}
                    </div>

                    <div style="display: flex; background: rgba(0,0,0,0.25); border-radius: 8px; border: 1px solid var(--glass-border); padding: 3px;">
                        <button onclick="window.setCatalogView('columns')" title="Columns / Group Cards View" style="border: none; border-radius: 6px; padding: 5px 10px; cursor: pointer; background: ${viewMode === 'columns' ? 'var(--color-primary)' : 'transparent'}; color: ${viewMode === 'columns' ? 'white' : '#888'}; display: flex; align-items: center; gap: 4px; font-size: 0.8rem;">
                            <i data-lucide="columns" style="width: 14px; height: 14px;"></i> Columns
                        </button>
                        <button onclick="window.setCatalogView('table')" title="Data Table View" style="border: none; border-radius: 6px; padding: 5px 10px; cursor: pointer; background: ${viewMode === 'table' ? 'var(--color-primary)' : 'transparent'}; color: ${viewMode === 'table' ? 'white' : '#888'}; display: flex; align-items: center; gap: 4px; font-size: 0.8rem;">
                            <i data-lucide="table" style="width: 14px; height: 14px;"></i> Table
                        </button>
                    </div>
                </div>
            </div>

            <!-- Content Area: Columns View or Table View -->
            ${viewMode === 'columns' ? `
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(330px, 1fr)); gap: 1.5rem; align-items: start;">
                    ${displayGroups.map(groupName => {
                        const meta = groupMeta[groupName] || defaultMeta;
                        const items = filteredCatalog.filter(m => (m.category || '').toLowerCase() === groupName.toLowerCase());
                        const isCustom = !['Profile', 'Pipe', 'Panel', 'Hinges', 'Lock & Accessories', 'Hook & Rubber', 'Paint'].includes(groupName);

                        return `
                            <div class="glass-panel" style="display: flex; flex-direction: column; border-radius: 12px; border: 1px solid var(--glass-border); background: var(--color-bg-card); overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.15);">
                                <!-- Column Header -->
                                <div style="padding: 1rem 1.25rem; border-bottom: 1px solid var(--glass-border); display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.02);">
                                    <div style="display: flex; align-items: center; gap: 0.65rem;">
                                        <div style="width: 34px; height: 34px; border-radius: 8px; background: ${meta.color}20; color: ${meta.color}; display: flex; align-items: center; justify-content: center; border: 1px solid ${meta.color}35;">
                                            <i data-lucide="${meta.icon}" style="width: 17px; height: 17px;"></i>
                                        </div>
                                        <div>
                                            <h3 style="margin: 0; font-size: 1.05rem; font-weight: 700; color: var(--color-text-heading);">${groupName}</h3>
                                            <span style="font-size: 0.72rem; color: var(--color-text-muted);">${items.length} materials</span>
                                        </div>
                                    </div>
                                    <div style="display: flex; align-items: center; gap: 0.35rem;">
                                        <button onclick="window.openAddMaterialModal('${groupName}')" title="Add item to ${groupName}" class="btn btn-secondary" style="padding: 4px 8px; font-size: 0.75rem; display: flex; align-items: center; gap: 3px; border-radius: 6px;">
                                            <i data-lucide="plus" style="width: 13px; height: 13px;"></i> Add
                                        </button>
                                        ${isCustom ? `
                                            <button onclick="window.deleteGroupPrompt('${groupName}')" title="Delete Group ${groupName}" style="background: transparent; border: none; color: #ef4444; cursor: pointer; padding: 4px 6px; border-radius: 6px; display: flex; align-items: center;">
                                                <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
                                            </button>
                                        ` : ''}
                                    </div>
                                </div>

                                <!-- Column Item List -->
                                <div style="padding: 1rem; display: flex; flex-direction: column; gap: 0.75rem; min-height: 120px;">
                                    ${items.length === 0 ? `
                                        <div style="padding: 2.5rem 1rem; text-align: center; color: var(--color-text-muted); font-size: 0.85rem; border: 1px dashed var(--glass-border); border-radius: 8px;">
                                            <p style="margin: 0 0 0.6rem 0;">No items found in <strong>${groupName}</strong>.</p>
                                            <button onclick="window.openAddMaterialModal('${groupName}')" class="btn btn-secondary" style="font-size: 0.78rem; padding: 5px 12px;">
                                                <i data-lucide="plus" style="width: 13px; height: 13px; display:inline-block; vertical-align:middle;"></i> Add First Item
                                            </button>
                                        </div>
                                    ` : items.map(item => `
                                        <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--glass-border); border-radius: 8px; padding: 0.85rem; display: flex; flex-direction: column; gap: 0.45rem; transition: all 0.15s;" onmouseover="this.style.borderColor='${meta.color}90'; this.style.background='rgba(255,255,255,0.05)';" onmouseout="this.style.borderColor='var(--glass-border)'; this.style.background='rgba(255,255,255,0.03)';">
                                            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5rem;">
                                                <div>
                                                    <div style="font-weight: 600; font-size: 0.92rem; color: var(--color-text-heading);">${item.name}</div>
                                                    <div style="font-size: 0.72rem; color: var(--color-text-muted); font-family: monospace;">ID: ${item.id}</div>
                                                </div>
                                                <span style="font-size: 0.7rem; font-weight: 700; text-transform: uppercase; padding: 2px 7px; border-radius: 4px; background: ${meta.color}15; color: ${meta.color}; border: 1px solid ${meta.color}40; white-space: nowrap;">
                                                    ${item.unit || 'pcs'}
                                                </span>
                                            </div>

                                            <!-- Category specific badges -->
                                            ${item.category === 'Profile' ? `
                                                <div style="font-size: 0.74rem; color: #94a3b8; display: flex; flex-wrap: wrap; gap: 4px; margin-top: 2px;">
                                                    <span style="background: rgba(59, 130, 246, 0.1); padding: 1px 6px; border-radius: 4px; border: 1px solid rgba(59, 130, 246, 0.2);">Side: ${item.sideWidthMm || 50}mm | Center: ${item.centerWidthMm || 25}mm</span>
                                                    ${item.weight16G ? `<span style="background: rgba(255,255,255,0.05); padding: 1px 6px; border-radius: 4px;">16G: ${item.weight16G}kg</span>` : ''}
                                                    ${item.weight18G ? `<span style="background: rgba(255,255,255,0.05); padding: 1px 6px; border-radius: 4px;">18G: ${item.weight18G}kg</span>` : ''}
                                                </div>
                                            ` : item.category === 'Pipe' ? `
                                                <div style="font-size: 0.74rem; color: #94a3b8; display: flex; flex-wrap: wrap; gap: 4px; margin-top: 2px;">
                                                    <span style="background: rgba(6, 182, 212, 0.1); padding: 1px 6px; border-radius: 4px; border: 1px solid rgba(6, 182, 212, 0.2);">Width: ${item.widthMm || 25}mm • ${item.thicknessGauge || item.thicknessMm || '18G'}</span>
                                                    ${item.weightPerLength ? `<span style="background: rgba(255,255,255,0.05); padding: 1px 6px; border-radius: 4px;">${item.weightPerLength} kg/length</span>` : ''}
                                                </div>
                                            ` : item.category === 'Panel' ? `
                                                <div style="font-size: 0.74rem; color: #94a3b8; display: flex; flex-wrap: wrap; gap: 4px; margin-top: 2px;">
                                                    <span style="background: rgba(139, 92, 246, 0.1); padding: 1px 6px; border-radius: 4px; border: 1px solid rgba(139, 92, 246, 0.2);">${item.meterPrice ? '₹' + item.meterPrice + '/meter (6m length)' : 'Standard Panel'}</span>
                                                </div>
                                            ` : item.category === 'Paint' ? `
                                                <div style="font-size: 0.74rem; color: #94a3b8; display: flex; flex-wrap: wrap; gap: 4px; margin-top: 2px;">
                                                    <span style="background: rgba(236, 72, 153, 0.1); padding: 1px 6px; border-radius: 4px; border: 1px solid rgba(236, 72, 153, 0.2);">Mode: ${item.pricingMode === 'sqft' ? 'Per Sq.Ft' : 'Per Kalli (Pane)'}</span>
                                                </div>
                                            ` : ''}

                                            ${item.description ? `
                                                <div style="font-size: 0.78rem; color: var(--color-text-muted); line-height: 1.35;">
                                                    ${item.description}
                                                </div>
                                            ` : ''}

                                            <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 0.4rem; border-top: 1px solid rgba(255,255,255,0.06); margin-top: 0.2rem;">
                                                <div style="display: flex; align-items: baseline; gap: 4px; flex-wrap: wrap;">
                                                    <span style="color: #10b981; font-weight: 700; font-size: 1.05rem;">₹${item.rate}</span>
                                                    <span style="font-size: 0.75rem; color: var(--color-text-muted);">/ ${item.unit}</span>
                                                </div>

                                                <div style="display: flex; align-items: center; gap: 4px;">
                                                    <button onclick="window.openEditMaterialModal('${item.id}')" title="Edit Item" style="background: transparent; border: none; color: #94a3b8; cursor: pointer; padding: 4px; border-radius: 4px; display: flex; align-items: center;" onmouseover="this.style.color='var(--color-primary)'" onmouseout="this.style.color='#94a3b8'">
                                                        <i data-lucide="edit-2" style="width: 14px; height: 14px;"></i>
                                                    </button>
                                                    <button onclick="window.deleteMaterialPrompt('${item.id}')" title="Delete Item" style="background: transparent; border: none; color: #ef4444; cursor: pointer; padding: 4px; border-radius: 4px; display: flex; align-items: center;" onmouseover="this.style.opacity='0.7'" onmouseout="this.style.opacity='1'">
                                                        <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            ` : `
                <!-- Table View -->
                <div class="glass-panel" style="padding: 0; border-radius: 10px; border: 1px solid var(--glass-border); overflow: hidden;">
                    <div style="overflow-x: auto;">
                        <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem;">
                            <thead>
                                <tr style="background: rgba(255,255,255,0.04); border-bottom: 1px solid var(--glass-border); color: var(--color-text-muted); font-size: 0.8rem; text-transform: uppercase;">
                                    <th style="padding: 12px 16px;">Material Component</th>
                                    <th style="padding: 12px 16px;">Category</th>
                                    <th style="padding: 12px 16px;">Attributes / Specs</th>
                                    <th style="padding: 12px 16px; width: 140px;">UoM</th>
                                    <th style="padding: 12px 16px; text-align: right;">Rate (₹)</th>
                                    <th style="padding: 12px 16px; text-align: center; width: 100px;">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${filteredCatalog.map(m => `
                                    <tr style="border-bottom: 1px solid var(--glass-border); transition: background 0.15s;" onmouseover="this.style.background='rgba(255,255,255,0.02)'" onmouseout="this.style.background='transparent'">
                                        <td style="padding: 12px 16px; font-weight: 600; color: var(--color-text-heading);">
                                            ${m.name}
                                            ${m.description ? `<div style="font-size: 0.75rem; color: var(--color-text-muted); font-weight: 400;">${m.description}</div>` : ''}
                                        </td>
                                        <td style="padding: 12px 16px;">
                                            <span style="font-size: 0.75rem; font-weight: 600; padding: 2px 8px; border-radius: 4px; background: rgba(59, 130, 246, 0.1); color: #3b82f6;">${m.category}</span>
                                        </td>
                                        <td style="padding: 12px 16px; font-size: 0.8rem; color: #94a3b8;">
                                            ${m.sideWidthMm ? `Side ${m.sideWidthMm}mm, Center ${m.centerWidthMm}mm` : m.widthMm ? `Width ${m.widthMm}mm` : m.meterPrice ? `₹${m.meterPrice}/m` : '-'}
                                        </td>
                                        <td style="padding: 12px 16px; font-weight: 600;">${m.unit}</td>
                                        <td style="padding: 12px 16px; text-align: right; font-weight: 700; color: #10b981;">₹${m.rate}</td>
                                        <td style="padding: 12px 16px; text-align: center;">
                                            <button onclick="window.openEditMaterialModal('${m.id}')" style="background: none; border: none; color: #94a3b8; cursor: pointer; padding: 4px;"><i data-lucide="edit-2" style="width: 14px; height: 14px;"></i></button>
                                            <button onclick="window.deleteMaterialPrompt('${m.id}')" style="background: none; border: none; color: #ef4444; cursor: pointer; padding: 4px;"><i data-lucide="trash-2" style="width: 14px; height: 14px;"></i></button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            `}
        </div>
    `;
}

export function renderCalcSettings(state) {
    return renderMaterialCatalog(state);
}

// Global action handlers for Material Catalog
window.setCatalogFilter = (groupId) => {
    window.matCatalogActiveGroup = groupId;
    Store.notify();
};

window.setCatalogSearch = (query) => {
    window.matCatalogSearchQuery = query;
    Store.notify();
};

window.setCatalogView = (mode) => {
    window.matCatalogViewMode = mode;
    Store.notify();
};

// Add Category Modal (Pre-populated with Profile, Pipe, Panel, Hinges, Paint, Lock & Accessories, Hook & Rubber)
window.openAddCategoryModal = () => {
    document.getElementById('catalog-group-modal')?.remove();
    const modal = document.createElement('div');
    modal.id = 'catalog-group-modal';
    modal.className = 'modal-backdrop';
    modal.style.cssText = 'position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.85); z-index:10000; display:flex; align-items:center; justify-content:center; padding:1rem;';

    const groups = (Store.state.materialGroups || ['Profile', 'Pipe', 'Panel', 'Hinges', 'Paint', 'Lock & Accessories', 'Hook & Rubber']).filter(g => g && g.toLowerCase() !== 'frame');

    modal.innerHTML = `
        <div class="glass-panel" style="width: 100%; max-width: 480px; padding: 1.75rem; background: var(--color-bg-card, #1e1e24); border: 1px solid var(--glass-border); border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.6);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; border-bottom: 1px solid var(--glass-border); padding-bottom: 0.75rem;">
                <h3 style="margin: 0; display: flex; align-items: center; gap: 0.5rem; font-size: 1.2rem; color: var(--color-text-heading);">
                    <i data-lucide="folder-plus" style="color: var(--color-primary);"></i> Add Material Category
                </h3>
                <button onclick="document.getElementById('catalog-group-modal').remove()" style="background: none; border: none; color: #888; cursor: pointer;"><i data-lucide="x"></i></button>
            </div>
            <form onsubmit="window.saveNewCatalogCategory(event)" style="display: flex; flex-direction: column; gap: 1rem;">
                <div>
                    <label style="display: block; font-size: 0.85rem; color: var(--color-text-muted); margin-bottom: 0.35rem; font-weight: 600;">Category Name *</label>
                    <input type="text" id="new-category-name" required placeholder="e.g. Profile, Pipe, Panel, Hinges, Paint, Lock & Accessories..." class="glass-input" style="width: 100%; font-size: 0.95rem; padding: 8px 12px;">
                </div>
                <div style="font-size: 0.78rem; color: var(--color-text-muted);">
                    <strong>Existing Categories:</strong>
                    <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-top: 6px;">
                        ${groups.map(g => `
                            <span style="background: rgba(255,255,255,0.06); padding: 2px 8px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.1); font-size: 0.75rem;">${g}</span>
                        `).join('')}
                    </div>
                </div>
                <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 0.5rem; border-top: 1px solid var(--glass-border); padding-top: 1rem;">
                    <button type="button" class="btn btn-secondary" onclick="document.getElementById('catalog-group-modal').remove()">Cancel</button>
                    <button type="submit" class="btn btn-primary" style="font-weight: 600;">Create Category</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
    if (window.lucide) window.lucide.createIcons();
    setTimeout(() => document.getElementById('new-category-name')?.focus(), 50);
};
window.openAddGroupModal = window.openAddCategoryModal;

window.saveNewCatalogCategory = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const nameInput = document.getElementById('new-category-name');
    const name = nameInput ? nameInput.value.trim() : '';
    if (!name) return;

    Store.addMaterialGroup(name);
    window.matCatalogActiveGroup = name;
    document.getElementById('catalog-group-modal')?.remove();
    Store.notify();
};

window.deleteGroupPrompt = (groupName) => {
    const items = (Store.state.materialCatalog || []).filter(m => (m.category || '').toLowerCase() === groupName.toLowerCase());
    const msg = items.length > 0 
        ? `Are you sure you want to delete category "${groupName}"? It contains ${items.length} item(s) which will also be removed.`
        : `Are you sure you want to delete category "${groupName}"?`;
    if (confirm(msg)) {
        if (items.length > 0) {
            items.forEach(it => Store.deleteMaterial(it.id));
        }
        Store.deleteMaterialGroup(groupName);
        if (window.matCatalogActiveGroup.toLowerCase() === groupName.toLowerCase()) {
            window.matCatalogActiveGroup = 'all';
        }
    }
};

// Add Item Modal with Category Specific Fields (Profile, Pipe, Panel, Hinges, Paint, Lock & Accessories, Hook & Rubber)
window.openAddMaterialModal = (defaultCategory) => {
    document.getElementById('add-material-modal')?.remove();
    const groups = (Store.state.materialGroups || ['Profile', 'Pipe', 'Panel', 'Hinges', 'Paint', 'Lock & Accessories', 'Hook & Rubber']).filter(g => g && g.toLowerCase() !== 'frame');
    const preselectedCat = defaultCategory || (window.matCatalogActiveGroup !== 'all' ? window.matCatalogActiveGroup : (groups[0] || 'Profile'));

    const modal = document.createElement('div');
    modal.id = 'add-material-modal';
    modal.className = 'modal-backdrop';
    modal.style.cssText = 'position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.85); z-index:10000; display:flex; align-items:center; justify-content:center; padding:1rem; overflow-y:auto;';

    modal.innerHTML = `
        <div class="glass-panel" style="width: 100%; max-width: 580px; padding: 2rem; background: var(--color-bg-card, #1e1e24); border: 1px solid var(--glass-border); border-radius: 14px; box-shadow: 0 10px 40px rgba(0,0,0,0.6); margin: auto;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; border-bottom: 1px solid var(--glass-border); padding-bottom: 0.75rem;">
                <h3 style="margin: 0; display: flex; align-items: center; gap: 0.5rem; font-size: 1.25rem; color: var(--color-text-heading);">
                    <i data-lucide="plus-circle" style="color: var(--color-primary);"></i> Add Item to Material Catalog
                </h3>
                <button onclick="document.getElementById('add-material-modal').remove()" style="background: none; border: none; color: #888; cursor: pointer;"><i data-lucide="x"></i></button>
            </div>

            <form onsubmit="window.saveNewCatalogMaterial(event)" style="display: flex; flex-direction: column; gap: 1rem;">
                <!-- Category Selector with Direct + Add Category Button -->
                <div>
                    <label style="display: block; font-size: 0.85rem; color: var(--color-text-muted); margin-bottom: 0.35rem; font-weight: 600;">Category *</label>
                    <div style="display: flex; gap: 8px; align-items: center;">
                        <select id="mat-new-cat" onchange="window.updateMaterialModalFields(this.value)" class="glass-input" style="flex: 1; padding: 8px 10px; font-size: 0.9rem; font-weight: 600;">
                            ${groups.map(g => `<option value="${g}" ${g.toLowerCase() === preselectedCat.toLowerCase() ? 'selected' : ''}>${g}</option>`).join('')}
                        </select>
                        <button type="button" onclick="window.openAddCategoryModal()" class="btn btn-secondary" style="white-space: nowrap; font-size: 0.8rem; padding: 7px 12px; display: flex; align-items: center; gap: 4px;">
                            <i data-lucide="folder-plus" style="width: 14px; height: 14px;"></i> + Add Category
                        </button>
                    </div>
                </div>

                <!-- Dynamic Form Container for Category Specific Fields -->
                <div id="dynamic-category-fields">
                    ${getCategoryFieldsHtml(preselectedCat)}
                </div>

                <!-- Description / Remarks -->
                <div>
                    <label style="display: block; font-size: 0.85rem; color: var(--color-text-muted); margin-bottom: 0.35rem; font-weight: 600;">Description / Remarks</label>
                    <input type="text" id="mat-new-desc" placeholder="Specification details or notes..." class="glass-input" style="width: 100%; padding: 8px 12px; font-size: 0.88rem;">
                </div>

                <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 0.75rem; border-top: 1px solid var(--glass-border); padding-top: 1rem;">
                    <button type="button" class="btn btn-secondary" onclick="document.getElementById('add-material-modal').remove()">Cancel</button>
                    <button type="submit" class="btn btn-primary" style="font-weight: 600; padding: 0.6rem 1.4rem;">Save Item to Catalog</button>
                </div>
            </form>
        </div>
    `;

    document.body.appendChild(modal);
    if (window.lucide) window.lucide.createIcons();
    setTimeout(() => document.getElementById('mat-new-name')?.focus(), 50);
};

// Generates dynamic fields based on user audio requirements
function getCategoryFieldsHtml(category) {
    const cat = (category || '').toLowerCase();
    
    if (cat === 'profile' || cat === 'frame') {
        return `
            <div style="display: flex; flex-direction: column; gap: 0.85rem;">
                <div>
                    <label style="display: block; font-size: 0.85rem; color: var(--color-text-muted); margin-bottom: 0.35rem; font-weight: 600;">Profile Size / Name *</label>
                    <input type="text" id="mat-new-name" required placeholder="e.g. 5x3 Profile, 4x2.5 Profile" class="glass-input" style="width: 100%; font-size: 0.95rem; padding: 8px 12px;">
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <div>
                        <label style="display: block; font-size: 0.82rem; color: var(--color-text-muted); margin-bottom: 0.35rem; font-weight: 600;">Thickness (Gauge or mm) *</label>
                        <select id="mat-prof-thick-mode" class="glass-input" style="width: 100%; padding: 8px 10px; font-size: 0.85rem;">
                            <option value="16G">16 Gauge (1.5 mm)</option>
                            <option value="18G">18 Gauge (1.2 mm)</option>
                            <option value="20G">20 Gauge (1.0 mm)</option>
                            <option value="mm">Custom mm</option>
                        </select>
                    </div>
                    <div>
                        <label style="display: block; font-size: 0.82rem; color: var(--color-text-muted); margin-bottom: 0.35rem; font-weight: 600;">Rate / Unit (₹) *</label>
                        <input type="number" step="0.5" id="mat-new-rate" required placeholder="e.g. 180" class="glass-input" style="width: 100%; padding: 8px 12px; font-weight: 700; color: #10b981;">
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <div>
                        <label style="display: block; font-size: 0.82rem; color: var(--color-text-muted); margin-bottom: 0.35rem; font-weight: 600;">Side Profile Width (mm) *</label>
                        <input type="number" step="1" id="mat-prof-side-w" required placeholder="e.g. 50" value="50" class="glass-input" style="width: 100%; padding: 8px 12px;">
                    </div>
                    <div>
                        <label style="display: block; font-size: 0.82rem; color: var(--color-text-muted); margin-bottom: 0.35rem; font-weight: 600;">Center Profile Width (mm) *</label>
                        <input type="number" step="1" id="mat-prof-center-w" required placeholder="e.g. 25" value="25" class="glass-input" style="width: 100%; padding: 8px 12px;">
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <div>
                        <label style="display: block; font-size: 0.82rem; color: var(--color-text-muted); margin-bottom: 0.35rem; font-weight: 600;">16 Gauge (1.5mm) Weight (kg) *</label>
                        <input type="number" step="0.01" id="mat-prof-wt16" required placeholder="e.g. 1.45" value="1.45" class="glass-input" style="width: 100%; padding: 8px 12px;">
                    </div>
                    <div>
                        <label style="display: block; font-size: 0.82rem; color: var(--color-text-muted); margin-bottom: 0.35rem; font-weight: 600;">18 Gauge (1.2mm) Weight (kg) *</label>
                        <input type="number" step="0.01" id="mat-prof-wt18" required placeholder="e.g. 1.20" value="1.20" class="glass-input" style="width: 100%; padding: 8px 12px;">
                    </div>
                </div>
            </div>
        `;
    } else if (cat === 'pipe') {
        return `
            <div style="display: flex; flex-direction: column; gap: 0.85rem;">
                <div>
                    <label style="display: block; font-size: 0.85rem; color: var(--color-text-muted); margin-bottom: 0.35rem; font-weight: 600;">Pipe Type / Name *</label>
                    <input type="text" id="mat-new-name" required placeholder="e.g. 1\" x 1\" MS Square Pipe, 1.5\"x1\" Rect Tube" class="glass-input" style="width: 100%; font-size: 0.95rem; padding: 8px 12px;">
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <div>
                        <label style="display: block; font-size: 0.82rem; color: var(--color-text-muted); margin-bottom: 0.35rem; font-weight: 600;">Thickness (Gauge or mm) *</label>
                        <input type="text" id="mat-pipe-thick" placeholder="e.g. 18G / 1.2mm" value="18G" class="glass-input" style="width: 100%; padding: 8px 12px;">
                    </div>
                    <div>
                        <label style="display: block; font-size: 0.82rem; color: var(--color-text-muted); margin-bottom: 0.35rem; font-weight: 600;">Width in mm *</label>
                        <input type="number" step="0.1" id="mat-pipe-width" required placeholder="e.g. 25.4" value="25.4" class="glass-input" style="width: 100%; padding: 8px 12px;">
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <div>
                        <label style="display: block; font-size: 0.82rem; color: var(--color-text-muted); margin-bottom: 0.35rem; font-weight: 600;">Weight per Length (kg) *</label>
                        <input type="number" step="0.01" id="mat-pipe-wt" required placeholder="e.g. 1.15" value="1.15" class="glass-input" style="width: 100%; padding: 8px 12px;">
                    </div>
                    <div>
                        <label style="display: block; font-size: 0.82rem; color: var(--color-text-muted); margin-bottom: 0.35rem; font-weight: 600;">Rate (₹/kg or length) *</label>
                        <input type="number" step="0.5" id="mat-new-rate" required placeholder="e.g. 95" class="glass-input" style="width: 100%; padding: 8px 12px; font-weight: 700; color: #10b981;">
                    </div>
                </div>
            </div>
        `;
    } else if (cat === 'panel') {
        return `
            <div style="display: flex; flex-direction: column; gap: 0.85rem;">
                <div>
                    <label style="display: block; font-size: 0.85rem; color: var(--color-text-muted); margin-bottom: 0.35rem; font-weight: 600;">Panel Type / Name *</label>
                    <input type="text" id="mat-new-name" required placeholder="e.g. 5mm Clear Float Glass, 4mm ACP Solid Sheet" class="glass-input" style="width: 100%; font-size: 0.95rem; padding: 8px 12px;">
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <div>
                        <label style="display: block; font-size: 0.82rem; color: var(--color-text-muted); margin-bottom: 0.35rem; font-weight: 600;">Charge per Meter (₹) *</label>
                        <input type="number" step="1" id="mat-panel-meter" required placeholder="e.g. 330 (6m standard length)" value="330" class="glass-input" style="width: 100%; padding: 8px 12px;">
                    </div>
                    <div>
                        <label style="display: block; font-size: 0.82rem; color: var(--color-text-muted); margin-bottom: 0.35rem; font-weight: 600;">Rate (₹ / sq.ft) *</label>
                        <input type="number" step="0.5" id="mat-new-rate" required placeholder="e.g. 55" class="glass-input" style="width: 100%; padding: 8px 12px; font-weight: 700; color: #10b981;">
                    </div>
                </div>
            </div>
        `;
    } else if (cat === 'hinges') {
        return `
            <div style="display: flex; flex-direction: column; gap: 0.85rem;">
                <div>
                    <label style="display: block; font-size: 0.85rem; color: var(--color-text-muted); margin-bottom: 0.35rem; font-weight: 600;">Hinge Type / Name *</label>
                    <input type="text" id="mat-new-name" required placeholder="e.g. Heavy Duty SS Butt Hinge 4\", Friction Stay 10\"" class="glass-input" style="width: 100%; font-size: 0.95rem; padding: 8px 12px;">
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <div>
                        <label style="display: block; font-size: 0.82rem; color: var(--color-text-muted); margin-bottom: 0.35rem; font-weight: 600;">Price (₹ per pair or piece) *</label>
                        <input type="number" step="1" id="mat-new-rate" required placeholder="e.g. 85" class="glass-input" style="width: 100%; padding: 8px 12px; font-weight: 700; color: #10b981;">
                    </div>
                    <div>
                        <label style="display: block; font-size: 0.82rem; color: var(--color-text-muted); margin-bottom: 0.35rem; font-weight: 600;">Unit</label>
                        <select id="mat-new-uom" class="glass-input" style="width: 100%; padding: 8px 10px;">
                            <option value="pcs" selected>Pieces (pcs)</option>
                            <option value="pair">Pair (pair)</option>
                        </select>
                    </div>
                </div>
            </div>
        `;
    } else if (cat === 'paint') {
        return `
            <div style="display: flex; flex-direction: column; gap: 0.85rem;">
                <div>
                    <label style="display: block; font-size: 0.85rem; color: var(--color-text-muted); margin-bottom: 0.35rem; font-weight: 600;">Paint Type / Name *</label>
                    <input type="text" id="mat-new-name" required placeholder="e.g. Epoxy Powder Coating (Matte Black)" class="glass-input" style="width: 100%; font-size: 0.95rem; padding: 8px 12px;">
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <div>
                        <label style="display: block; font-size: 0.82rem; color: var(--color-text-muted); margin-bottom: 0.35rem; font-weight: 600;">Pricing Option *</label>
                        <select id="mat-paint-mode" class="glass-input" style="width: 100%; padding: 8px 10px;">
                            <option value="kalli" selected>Price per Kalli (Pane)</option>
                            <option value="sqft">Price per Sq.Ft</option>
                        </select>
                    </div>
                    <div>
                        <label style="display: block; font-size: 0.82rem; color: var(--color-text-muted); margin-bottom: 0.35rem; font-weight: 600;">Price (₹) *</label>
                        <input type="number" step="1" id="mat-new-rate" required placeholder="e.g. 450 per kalli or 35 per sqft" class="glass-input" style="width: 100%; padding: 8px 12px; font-weight: 700; color: #10b981;">
                    </div>
                </div>
            </div>
        `;
    } else if (cat === 'lock & accessories' || cat === 'lock') {
        return `
            <div style="display: flex; flex-direction: column; gap: 0.85rem;">
                <div>
                    <label style="display: block; font-size: 0.85rem; color: var(--color-text-muted); margin-bottom: 0.35rem; font-weight: 600;">Item Name / Type *</label>
                    <input type="text" id="mat-new-name" required placeholder="e.g. Cockspur Window Handle Lock, Multipoint Espag" class="glass-input" style="width: 100%; font-size: 0.95rem; padding: 8px 12px;">
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <div>
                        <label style="display: block; font-size: 0.82rem; color: var(--color-text-muted); margin-bottom: 0.35rem; font-weight: 600;">Price (₹) *</label>
                        <input type="number" step="1" id="mat-new-rate" required placeholder="e.g. 160" class="glass-input" style="width: 100%; padding: 8px 12px; font-weight: 700; color: #10b981;">
                    </div>
                    <div>
                        <label style="display: block; font-size: 0.82rem; color: var(--color-text-muted); margin-bottom: 0.35rem; font-weight: 600;">Unit</label>
                        <select id="mat-new-uom" class="glass-input" style="width: 100%; padding: 8px 10px;">
                            <option value="pcs" selected>Pieces (pcs)</option>
                            <option value="set">Set (set)</option>
                        </select>
                    </div>
                </div>
            </div>
        `;
    } else if (cat === 'hook & rubber' || cat === 'hook') {
        return `
            <div style="display: flex; flex-direction: column; gap: 0.85rem;">
                <div>
                    <label style="display: block; font-size: 0.85rem; color: var(--color-text-muted); margin-bottom: 0.35rem; font-weight: 600;">Item Name / Type *</label>
                    <input type="text" id="mat-new-name" required placeholder="e.g. Casement Stay Wind Hook 8\", EPDM Gasket Strip" class="glass-input" style="width: 100%; font-size: 0.95rem; padding: 8px 12px;">
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <div>
                        <label style="display: block; font-size: 0.82rem; color: var(--color-text-muted); margin-bottom: 0.35rem; font-weight: 600;">Price (₹) *</label>
                        <input type="number" step="1" id="mat-new-rate" required placeholder="e.g. 75" class="glass-input" style="width: 100%; padding: 8px 12px; font-weight: 700; color: #10b981;">
                    </div>
                    <div>
                        <label style="display: block; font-size: 0.82rem; color: var(--color-text-muted); margin-bottom: 0.35rem; font-weight: 600;">Unit</label>
                        <select id="mat-new-uom" class="glass-input" style="width: 100%; padding: 8px 10px;">
                            <option value="pcs" selected>Pieces (pcs)</option>
                            <option value="mtr">Meters (mtr)</option>
                        </select>
                    </div>
                </div>
            </div>
        `;
    } else {
        return `
            <div style="display: flex; flex-direction: column; gap: 0.85rem;">
                <div>
                    <label style="display: block; font-size: 0.85rem; color: var(--color-text-muted); margin-bottom: 0.35rem; font-weight: 600;">Item Name *</label>
                    <input type="text" id="mat-new-name" required placeholder="e.g. Custom Material" class="glass-input" style="width: 100%; font-size: 0.95rem; padding: 8px 12px;">
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <div>
                        <label style="display: block; font-size: 0.82rem; color: var(--color-text-muted); margin-bottom: 0.35rem; font-weight: 600;">Unit of Measure *</label>
                        <input type="text" id="mat-new-uom" value="pcs" class="glass-input" style="width: 100%; padding: 8px 12px;">
                    </div>
                    <div>
                        <label style="display: block; font-size: 0.82rem; color: var(--color-text-muted); margin-bottom: 0.35rem; font-weight: 600;">Rate (₹) *</label>
                        <input type="number" step="0.5" id="mat-new-rate" required placeholder="e.g. 100" class="glass-input" style="width: 100%; padding: 8px 12px; font-weight: 700; color: #10b981;">
                    </div>
                </div>
            </div>
        `;
    }
}

window.updateMaterialModalFields = (category) => {
    const container = document.getElementById('dynamic-category-fields');
    if (container) {
        container.innerHTML = getCategoryFieldsHtml(category);
    }
};

window.saveNewCatalogMaterial = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const category = document.getElementById('mat-new-cat')?.value || 'Profile';
    const name = document.getElementById('mat-new-name')?.value.trim() || 'New Item';
    const rate = parseFloat(document.getElementById('mat-new-rate')?.value) || 0;
    const desc = document.getElementById('mat-new-desc')?.value.trim() || '';

    const catLower = category.toLowerCase();
    const id = 'mat_' + catLower.replace(/[^a-z0-9]/g, '').slice(0, 5) + '_' + Date.now().toString().slice(-4);

    const newMaterial = {
        id,
        name,
        category,
        rate,
        description: desc
    };

    if (catLower === 'profile' || catLower === 'frame') {
        newMaterial.unit = 'kg';
        newMaterial.thicknessGauge = document.getElementById('mat-prof-thick-mode')?.value || '16G';
        newMaterial.sideWidthMm = parseFloat(document.getElementById('mat-prof-side-w')?.value) || 50;
        newMaterial.centerWidthMm = parseFloat(document.getElementById('mat-prof-center-w')?.value) || 25;
        newMaterial.weight16G = parseFloat(document.getElementById('mat-prof-wt16')?.value) || 1.45;
        newMaterial.weight18G = parseFloat(document.getElementById('mat-prof-wt18')?.value) || 1.20;
        newMaterial.weightFactor = newMaterial.weight16G;
    } else if (catLower === 'pipe') {
        newMaterial.unit = 'kg';
        newMaterial.thicknessGauge = document.getElementById('mat-pipe-thick')?.value || '18G';
        newMaterial.widthMm = parseFloat(document.getElementById('mat-pipe-width')?.value) || 25.4;
        newMaterial.weightPerLength = parseFloat(document.getElementById('mat-pipe-wt')?.value) || 1.15;
        newMaterial.weightFactor = newMaterial.weightPerLength;
    } else if (catLower === 'panel') {
        newMaterial.unit = 'sq.ft';
        newMaterial.meterPrice = parseFloat(document.getElementById('mat-panel-meter')?.value) || 330;
        newMaterial.standardLength = 6;
        newMaterial.weightFactor = 1.15;
    } else if (catLower === 'paint') {
        newMaterial.pricingMode = document.getElementById('mat-paint-mode')?.value || 'kalli';
        newMaterial.unit = newMaterial.pricingMode === 'sqft' ? 'sq.ft' : 'pane';
        if (newMaterial.pricingMode === 'kalli') {
            newMaterial.pricePerKalli = rate;
            newMaterial.pricePerSqFt = 35;
        } else {
            newMaterial.pricePerSqFt = rate;
            newMaterial.pricePerKalli = 450;
        }
    } else {
        newMaterial.unit = document.getElementById('mat-new-uom')?.value || 'pcs';
        newMaterial.weightFactor = 0.25;
    }

    Store.addMaterial(newMaterial);
    document.getElementById('add-material-modal')?.remove();
    Store.notify();
};

window.openEditMaterialModal = (itemId) => {
    document.getElementById('edit-material-modal')?.remove();
    const item = (Store.state.materialCatalog || []).find(m => m.id === itemId);
    if (!item) return;

    const modal = document.createElement('div');
    modal.id = 'edit-material-modal';
    modal.className = 'modal-backdrop';
    modal.style.cssText = 'position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.85); z-index:10000; display:flex; align-items:center; justify-content:center; padding:1rem;';

    modal.innerHTML = `
        <div class="glass-panel" style="width: 100%; max-width: 500px; padding: 2rem; background: var(--color-bg-card, #1e1e24); border: 1px solid var(--glass-border); border-radius: 14px; box-shadow: 0 10px 40px rgba(0,0,0,0.6);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; border-bottom: 1px solid var(--glass-border); padding-bottom: 0.75rem;">
                <h3 style="margin: 0; display: flex; align-items: center; gap: 0.5rem; font-size: 1.25rem; color: var(--color-text-heading);">
                    <i data-lucide="edit-2" style="color: var(--color-primary);"></i> Edit Material Item
                </h3>
                <button onclick="document.getElementById('edit-material-modal').remove()" style="background: none; border: none; color: #888; cursor: pointer;"><i data-lucide="x"></i></button>
            </div>

            <form onsubmit="window.saveEditCatalogMaterial(event, '${item.id}')" style="display: flex; flex-direction: column; gap: 1rem;">
                <div>
                    <label style="display: block; font-size: 0.85rem; color: var(--color-text-muted); margin-bottom: 0.35rem; font-weight: 600;">Item Name *</label>
                    <input type="text" id="mat-edit-name" required value="${item.name || ''}" class="glass-input" style="width: 100%; font-size: 0.95rem; padding: 8px 12px;">
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <div>
                        <label style="display: block; font-size: 0.85rem; color: var(--color-text-muted); margin-bottom: 0.35rem; font-weight: 600;">Category</label>
                        <input type="text" value="${item.category}" readonly class="glass-input" style="width: 100%; padding: 8px 10px; opacity: 0.8;">
                    </div>
                    <div>
                        <label style="display: block; font-size: 0.85rem; color: #10b981; font-weight: 600; margin-bottom: 0.35rem;">Rate (₹) *</label>
                        <input type="number" step="0.5" id="mat-edit-rate" required value="${item.rate || 0}" class="glass-input" style="width: 100%; padding: 8px 12px; font-weight: 700; color: #10b981;">
                    </div>
                </div>

                <div>
                    <label style="display: block; font-size: 0.85rem; color: var(--color-text-muted); margin-bottom: 0.35rem; font-weight: 600;">Description</label>
                    <input type="text" id="mat-edit-desc" value="${item.description || ''}" class="glass-input" style="width: 100%; padding: 8px 12px;">
                </div>

                <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 0.75rem; border-top: 1px solid var(--glass-border); padding-top: 1rem;">
                    <button type="button" class="btn btn-secondary" onclick="document.getElementById('edit-material-modal').remove()">Cancel</button>
                    <button type="submit" class="btn btn-primary" style="font-weight: 600;">Update Material</button>
                </div>
            </form>
        </div>
    `;

    document.body.appendChild(modal);
    if (window.lucide) window.lucide.createIcons();
};

window.saveEditCatalogMaterial = (e, itemId) => {
    if (e && e.preventDefault) e.preventDefault();
    const item = (Store.state.materialCatalog || []).find(m => m.id === itemId);
    if (!item) return;

    item.name = document.getElementById('mat-edit-name')?.value.trim() || item.name;
    item.rate = parseFloat(document.getElementById('mat-edit-rate')?.value) || item.rate;
    item.description = document.getElementById('mat-edit-desc')?.value.trim() || item.description;

    Store.saveState();
    document.getElementById('edit-material-modal')?.remove();
    Store.notify();
};

window.deleteMaterialPrompt = (id) => {
    if (confirm('Delete this material item from catalog?')) {
        Store.deleteMaterial(id);
    }
};



// Global Material Search state
window.calcMaterialSearchQuery = window.calcMaterialSearchQuery || '';
window.filterCalcMaterials = (q) => {
    window.calcMaterialSearchQuery = (q || '').toLowerCase().trim();
    Store.notify();
};

window.studioMaterialSearchQuery = window.studioMaterialSearchQuery || '';
window.filterStudioMaterials = (q) => {
    window.studioMaterialSearchQuery = (q || '').toLowerCase().trim();
    Store.notify();
};

// =========================================================================
// AUTOCOMPLETE & SAVED FILES SEARCH CONTROLLER
// =========================================================================
function parseWindowSpecs(item, defaultUnit = 'cm') {
    let w = item.width ? parseFloat(item.width) : 0;
    let h = item.height ? parseFloat(item.height) : 0;
    let unit = item.unit || defaultUnit || 'cm';
    let cols = item.cols ? parseInt(item.cols) : 0;

    if (!w || !h) {
        const text = `${item.name || ''} ${item.desc || ''}`;
        const dimMatch = text.match(/(\d+(?:\.\d+)?)\s*[*xX×]\s*(\d+(?:\.\d+)?)/);
        if (dimMatch) {
            let n1 = parseFloat(dimMatch[1]);
            let n2 = parseFloat(dimMatch[2]);
            // If feet format like 4x4, 6x7, 2x2 without cm/mm, convert to cm
            if (n1 <= 12 && n2 <= 12 && !text.toLowerCase().includes('cm') && !text.toLowerCase().includes('mm')) {
                w = Math.round(n1 * 30.48);
                h = Math.round(n2 * 30.48);
                unit = 'cm';
            } else {
                w = n1;
                h = n2;
            }
        } else {
            w = 100;
            h = 140;
            unit = 'cm';
        }
    }

    if (!cols) {
        const kMatch = (item.desc || '').match(/(\d)\s*kalli/i);
        if (kMatch) {
            cols = parseInt(kMatch[1]);
        } else {
            const wCm = convertUnit(w, unit, 'cm');
            cols = Math.max(1, Math.min(6, Math.round(wCm / 50)));
        }
    }

    return { w, h, unit, cols };
}

window.openCalcSearchDropdown = (value) => {
    window.renderCalcSearchDropdown(value || '');
};

window.handleCalcSearchInput = (value) => {
    window.calcSearchQuery = value;
    const clearBtn = document.getElementById('calc-search-clear-btn');
    if (clearBtn) {
        clearBtn.style.display = value ? 'flex' : 'none';
    }
    window.renderCalcSearchDropdown(value);
};

window.handleCalcSearchKey = (event) => {
    const dd = document.getElementById('calc-search-dropdown');
    if (event.key === 'Escape') {
        window.closeCalcSearchDropdown();
        return;
    }

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        if (!dd || dd.style.display === 'none') {
            window.renderCalcSearchDropdown(event.target.value || '');
        }
        if (!dd) return;

        const items = Array.from(dd.querySelectorAll('.calc-search-dropdown-item'));
        if (items.length === 0) return;

        event.preventDefault();
        let activeIdx = items.findIndex(el => el.classList.contains('nav-active'));

        if (event.key === 'ArrowDown') {
            activeIdx = (activeIdx === -1) ? 0 : (activeIdx + 1) % items.length;
        } else {
            activeIdx = (activeIdx <= 0) ? items.length - 1 : activeIdx - 1;
        }

        items.forEach(el => {
            el.classList.remove('nav-active');
            el.style.backgroundColor = 'transparent';
            el.style.outline = 'none';
        });

        const target = items[activeIdx];
        if (target) {
            target.classList.add('nav-active');
            target.style.backgroundColor = '#dbeafe';
            target.style.outline = '2px solid #0284c7';
            target.style.outlineOffset = '-2px';
            target.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
        return;
    }

    if (event.key === 'Enter') {
        if (dd && dd.style.display !== 'none') {
            const items = Array.from(dd.querySelectorAll('.calc-search-dropdown-item'));
            const activeItem = dd.querySelector('.calc-search-dropdown-item.nav-active');
            if (activeItem) {
                event.preventDefault();
                activeItem.click();
                window.closeCalcSearchDropdown();
                return;
            } else if (items.length > 0) {
                event.preventDefault();
                items[0].click();
                window.closeCalcSearchDropdown();
                return;
            }
        }
        const val = (event.target.value || '').trim();
        if (val) {
            window.handleCalcSearch(val);
            window.closeCalcSearchDropdown();
        }
    }
};


window.closeCalcSearchDropdown = () => {
    const dd = document.getElementById('calc-search-dropdown');
    if (dd) dd.style.display = 'none';
};

window.clearCalcSearch = () => {
    window.calcSearchQuery = '';
    const input = document.getElementById('calc-search-bar');
    if (input) {
        input.value = '';
        input.focus();
    }
    const clearBtn = document.getElementById('calc-search-clear-btn');
    if (clearBtn) clearBtn.style.display = 'none';
    window.renderCalcSearchDropdown('');
};

window.renderCalcSearchDropdown = (query) => {
    const dd = document.getElementById('calc-search-dropdown');
    if (!dd) return;

    const q = (query || '').trim().toLowerCase();
    const g = Store.state.rateCalc?.grid || { unit: 'cm' };

    // 1. Collect all saved items from quotations
    const allSavedItems = [];
    (Store.state.quotations || []).forEach(quote => {
        (quote.items || []).forEach((it, idx) => {
            const specs = parseWindowSpecs(it, g.unit);
            allSavedItems.push({
                quoteId: quote.id,
                quoteDate: quote.date,
                customer: quote.customer || 'Customer',
                itemIndex: idx,
                name: it.name || `Window Item ${idx + 1}`,
                desc: it.desc || '',
                rate: it.rate || it.total || quote.amount || 0,
                specs: specs
            });
        });
    });

    let filteredSaved = [];
    if (!q) {
        // Show recent up to 6 saved items
        filteredSaved = allSavedItems.slice(0, 6);
    } else {
        filteredSaved = allSavedItems.filter(it => {
            return it.name.toLowerCase().includes(q) ||
                   it.desc.toLowerCase().includes(q) ||
                   it.customer.toLowerCase().includes(q) ||
                   it.quoteId.toLowerCase().includes(q) ||
                   `${it.specs.cols} kalli`.includes(q) ||
                   `${it.specs.w}x${it.specs.h}`.includes(q) ||
                   `${it.specs.w}*${it.specs.h}`.includes(q);
        }).slice(0, 8);
    }

    // 2. Standard Window Presets
    const presets = [
        { k: 1, title: '1 Kalli Window', size: '50 × 140 cm', desc: 'Single Pane Standard' },
        { k: 2, title: '2 Kalli Window', size: '100 × 140 cm', desc: 'Double Pane Casement' },
        { k: 3, title: '3 Kalli Window', size: '150 × 140 cm', desc: 'Triple Pane Standard' },
        { k: 4, title: '4 Kalli Window', size: '200 × 140 cm', desc: '4 Pane Wide Model' },
        { k: 5, title: '5 Kalli Window', size: '250 × 140 cm', desc: '5 Pane Villa Window' },
        { k: 6, title: '6 Kalli Window', size: '300 × 140 cm', desc: '6 Pane Panoramic' },
    ];
    let filteredPresets = [];
    if (!q) {
        filteredPresets = presets;
    } else {
        filteredPresets = presets.filter(p => {
            return p.title.toLowerCase().includes(q) ||
                   p.desc.toLowerCase().includes(q) ||
                   p.size.toLowerCase().includes(q) ||
                   q === 'w' || q === 'window' || q === 'preset' || q === 'kalli' ||
                   q.includes(String(p.k));
        });
    }

    // 3. Dimension Parser Match (e.g. 100x140, 120*150)
    let dimActionHtml = '';
    const dimMatch = q.match(/(\d+(?:\.\d+)?)\s*[*xX×]\s*(\d+(?:\.\d+)?)/);
    if (dimMatch) {
        const dw = parseFloat(dimMatch[1]);
        const dh = parseFloat(dimMatch[2]);
        if (dw > 0 && dh > 0) {
            const baseWCm = convertUnit(dw, g.unit, 'cm');
            const estCols = Math.max(1, Math.min(6, Math.round(baseWCm / 50)));
            dimActionHtml = `
                <div 
                    onclick="window.applyCustomDimension(${dw}, ${dh})"
                    class="calc-search-dropdown-item"
                    style="background: #f0fdf4; border-bottom: 1.5px solid #bbf7d0; display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; cursor: pointer;"
                >
                    <div>
                        <div style="font-weight: 800; font-size: 0.86rem; color: #166534; display: flex; align-items: center; gap: 6px;">
                            <span>📐</span> Apply Window Size: <strong>${dw} × ${dh} ${g.unit}</strong>
                        </div>
                        <div style="font-size: 0.73rem; color: #15803d; margin-top: 2px;">
                            Auto-configured as <strong>${estCols} Kalli</strong> (${(dw/estCols).toFixed(1)} ${g.unit} per pane)
                        </div>
                    </div>
                    <span style="font-size: 0.72rem; font-weight: 800; background: #166534; color: #ffffff; padding: 4px 9px; border-radius: 4px;">APPLY SIZE</span>
                </div>
            `;
        }
    }

    // 4. Catalog Materials (Profiles, Sections, Panels)
    let filteredMaterials = [];
    if (q && q.length >= 2) {
        const allMats = (Store.state.materialCatalog || []);
        filteredMaterials = allMats.filter(m => {
            return (m.name || '').toLowerCase().includes(q) ||
                   (m.category || '').toLowerCase().includes(q) ||
                   (m.desc || '').toLowerCase().includes(q);
        }).slice(0, 4);
    }

    // Build the Dropdown HTML
    let html = '';

    // Direct Dimension Card if present
    if (dimActionHtml) {
        html += dimActionHtml;
    }

    // Saved Files & Quotations section removed per user request

    // Standard Window Types & Presets Section
    if (filteredPresets.length > 0) {
        html += `
            <div style="padding: 7px 12px; background: #f8fafc; font-size: 0.72rem; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: space-between;">
                <span>📐 Window Types & Presets</span>
                <span style="font-size: 0.68rem; color: #64748b; font-weight: 600;">Standard Models</span>
            </div>
        `;
        filteredPresets.forEach(p => {
            html += `
                <div 
                    class="calc-search-dropdown-item"
                    onclick="window.selectPresetFromSearch(${p.k})"
                    style="padding: 8px 12px; border-bottom: 1px solid #f1f5f9; cursor: pointer; display: flex; justify-content: space-between; align-items: center;"
                >
                    <div>
                        <div style="font-weight: 700; font-size: 0.83rem; color: #0f172a;">
                            ${p.title} <span style="font-size: 0.76rem; color: #64748b; font-weight: 500;">(${p.size})</span>
                        </div>
                        <div style="font-size: 0.72rem; color: #94a3b8;">${p.desc}</div>
                    </div>
                    <span style="font-size: 0.7rem; font-weight: 700; color: #059669; background: #d1fae5; padding: 2px 6px; border-radius: 4px;">${p.k} Pane</span>
                </div>
            `;
        });
    }

    // Matching Materials Section
    if (filteredMaterials.length > 0) {
        html += `
            <div style="padding: 7px 12px; background: #f8fafc; font-size: 0.72rem; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0;">
                🔩 Matching Catalog Materials
            </div>
        `;
        filteredMaterials.forEach(m => {
            html += `
                <div 
                    class="calc-search-dropdown-item"
                    onclick="window.selectMaterialFromSearch('${m.id}', '${m.category}')"
                    style="padding: 8px 12px; border-bottom: 1px solid #f1f5f9; cursor: pointer; display: flex; justify-content: space-between; align-items: center;"
                >
                    <div>
                        <div style="font-weight: 700; font-size: 0.82rem; color: #0f172a;">${m.name}</div>
                        <div style="font-size: 0.72rem; color: #64748b;">${m.category || 'Material'} • ${m.unit || 'nos'}</div>
                    </div>
                    <span style="font-size: 0.75rem; font-weight: 800; color: #0284c7;">₹${m.rate}</span>
                </div>
            `;
        });
    }

    if (!html) {
        html = `
            <div style="padding: 16px; text-align: center; color: #64748b; font-size: 0.82rem;">
                No saved window files or types matching "<strong>${query}</strong>".<br>
                <span style="font-size: 0.74rem; color: #94a3b8; margin-top: 4px; display: inline-block;">
                    Type dimensions like <strong>100x140</strong> or customer name to search.
                </span>
            </div>
        `;
    }

    dd.innerHTML = html;
    dd.style.display = 'block';
};

window.applyCustomDimension = (w, h) => {
    if (typeof window.snapshotCurrentCalc === 'function') window.snapshotCurrentCalc();
    
    // In rateCalc:
    if (Store.state.rateCalc && Store.state.rateCalc.grid) {
        const g = Store.state.rateCalc.grid;
        g.totalW = w;
        g.totalH = h;
        const baseWCm = convertUnit(w, g.unit, 'cm');
        const estimatedCols = Math.max(1, Math.min(6, Math.round(baseWCm / 50)));
        g.cols = estimatedCols;
        const paneW = parseFloat((w / estimatedCols).toFixed(1));
        g.paneWidths = Array(estimatedCols).fill(paneW);
        g.panePartitions = Array(estimatedCols).fill(0);
        g.partitionPos = Array(estimatedCols).fill('top');
    }

    // In quoteStudio currentWindow if present:
    if (Store.state.quoteStudio && Store.state.quoteStudio.currentWindow) {
        const cw = Store.state.quoteStudio.currentWindow;
        cw.totalW = w;
        cw.totalH = h;
        const baseWCm = convertUnit(w, cw.unit, 'cm');
        const estimatedCols = Math.max(1, Math.min(6, Math.round(baseWCm / 50)));
        cw.cols = estimatedCols;
        const paneW = parseFloat((w / estimatedCols).toFixed(1));
        cw.paneWidths = Array(estimatedCols).fill(paneW);
        cw.panePartitions = Array(estimatedCols).fill(0);
    }

    window.calcSearchQuery = '';
    const input = document.getElementById('calc-search-bar');
    if (input) input.value = '';
    const clearBtn = document.getElementById('calc-search-clear-btn');
    if (clearBtn) clearBtn.style.display = 'none';
    const dd = document.getElementById('calc-search-dropdown');
    if (dd) dd.style.display = 'none';

    Store.notify();
};

window.selectPresetFromSearch = (k) => {
    if (Store.state.quoteStudio && Store.state.quoteStudio.step === 'canvas') {
        window.loadStudioPreset(k);
    } else {
        window.loadPreset(k);
    }
    window.calcSearchQuery = '';
    const input = document.getElementById('calc-search-bar');
    if (input) input.value = '';
    const clearBtn = document.getElementById('calc-search-clear-btn');
    if (clearBtn) clearBtn.style.display = 'none';
    const dd = document.getElementById('calc-search-dropdown');
    if (dd) dd.style.display = 'none';
};

window.selectMaterialFromSearch = (matId, category) => {
    const rc = Store.state.rateCalc;
    if (rc && rc.materials) {
        const catKey = (category || '').toLowerCase();
        if (catKey.includes('profile') || catKey.includes('frame')) rc.materials.frame = matId;
        else if (catKey.includes('pipe') || catKey.includes('tube')) rc.materials.pipe = matId;
        else if (catKey.includes('panel') || catKey.includes('glass') || catKey.includes('sheet')) rc.materials.panel = matId;
        else if (catKey.includes('hinge')) rc.materials.hinge = matId;
        else if (catKey.includes('lock')) rc.materials.lock = matId;
        else if (catKey.includes('hook') || catKey.includes('rubber')) rc.materials.hook = matId;
        else if (catKey.includes('paint') || catKey.includes('coating')) rc.materials.paint = matId;
    }
    if (Store.state.quoteStudio && Store.state.quoteStudio.materials) {
        const qm = Store.state.quoteStudio.materials;
        const catKey = (category || '').toLowerCase();
        if (catKey.includes('profile') || catKey.includes('frame')) qm.frame = matId;
        else if (catKey.includes('pipe') || catKey.includes('tube')) qm.pipe = matId;
        else if (catKey.includes('panel') || catKey.includes('glass') || catKey.includes('sheet')) qm.panel = matId;
        else if (catKey.includes('hinge')) qm.hinge = matId;
        else if (catKey.includes('lock')) qm.lock = matId;
        else if (catKey.includes('hook') || catKey.includes('rubber')) qm.hook = matId;
        else if (catKey.includes('paint') || catKey.includes('coating')) qm.paint = matId;
    }
    window.calcSearchQuery = '';
    const input = document.getElementById('calc-search-bar');
    if (input) input.value = '';
    const clearBtn = document.getElementById('calc-search-clear-btn');
    if (clearBtn) clearBtn.style.display = 'none';
    const dd = document.getElementById('calc-search-dropdown');
    if (dd) dd.style.display = 'none';

    Store.notify();
};

window.loadSavedWindowDesign = (quoteId, itemIndex) => {
    const qList = Store.state.quotations || [];
    const quote = qList.find(q => q.id === quoteId);
    if (!quote || !quote.items || !quote.items[itemIndex]) return;
    const item = quote.items[itemIndex];

    const specs = parseWindowSpecs(item, Store.state.rateCalc?.grid?.unit || 'cm');

    // 1. If currently in Quotation Studio Step 2
    if (Store.state.quoteStudio && Store.state.quoteStudio.currentWindow) {
        const cw = Store.state.quoteStudio.currentWindow;
        cw.totalW = specs.w;
        cw.totalH = specs.h;
        cw.unit = specs.unit;
        cw.cols = specs.cols;
        const paneW = parseFloat((cw.totalW / cw.cols).toFixed(1));
        cw.paneWidths = (item.paneWidths && item.paneWidths.length === cw.cols) ? [...item.paneWidths] : Array(cw.cols).fill(paneW);
        cw.panePartitions = (item.panePartitions && item.panePartitions.length === cw.cols) ? [...item.panePartitions] : Array(cw.cols).fill(0);
        cw.name = item.name || `Window W${cw.cols}`;
    }

    // 2. Also update rateCalc (Quick Calculation canvas)
    if (Store.state.rateCalc && Store.state.rateCalc.grid) {
        if (typeof window.snapshotCurrentCalc === 'function') window.snapshotCurrentCalc();
        const g = Store.state.rateCalc.grid;
        g.totalW = specs.w;
        g.totalH = specs.h;
        g.unit = specs.unit;
        g.cols = specs.cols;
        const paneW = parseFloat((g.totalW / g.cols).toFixed(1));
        g.paneWidths = (item.paneWidths && item.paneWidths.length === g.cols) ? [...item.paneWidths] : Array(g.cols).fill(paneW);
        g.panePartitions = (item.panePartitions && item.panePartitions.length === g.cols) ? [...item.panePartitions] : Array(g.cols).fill(0);
        g.partitionPos = Array(g.cols).fill('top');
    }

    if (Store.state.calculation) {
        if (quote.customer) Store.state.calculation.customerName = quote.customer;
        Store.state.calculation.itemName = item.name || `Window W${specs.cols}`;
    }

    // Reset search
    window.calcSearchQuery = '';
    const input = document.getElementById('calc-search-bar');
    if (input) input.value = '';
    const clearBtn = document.getElementById('calc-search-clear-btn');
    if (clearBtn) clearBtn.style.display = 'none';
    const dd = document.getElementById('calc-search-dropdown');
    if (dd) dd.style.display = 'none';

    Store.notify();
};

// Customer Autocomplete for Quotation Studio Step 1
window.showQuoteCustDropdown = (value) => {
    window.renderQuoteCustDropdown(value || '');
};

window.handleQuoteCustInput = (value) => {
    if (Store.state.quoteStudio?.customer) {
        Store.state.quoteStudio.customer.name = value;
    }
    window.renderQuoteCustDropdown(value);
};

window.handleQuoteCustKey = (event) => {
    const dd = document.getElementById('qs-cust-dropdown');
    if (event.key === 'Escape') {
        if (dd) dd.style.display = 'none';
        return;
    }

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        if (!dd || dd.style.display === 'none') {
            window.renderQuoteCustDropdown(event.target.value || '');
        }
        if (!dd) return;

        const items = Array.from(dd.querySelectorAll('.calc-search-dropdown-item'));
        if (items.length === 0) return;

        event.preventDefault();
        let activeIdx = items.findIndex(el => el.classList.contains('nav-active'));

        if (event.key === 'ArrowDown') {
            activeIdx = (activeIdx === -1) ? 0 : (activeIdx + 1) % items.length;
        } else {
            activeIdx = (activeIdx <= 0) ? items.length - 1 : activeIdx - 1;
        }

        items.forEach(el => {
            el.classList.remove('nav-active');
            el.style.backgroundColor = 'transparent';
            el.style.outline = 'none';
        });

        const target = items[activeIdx];
        if (target) {
            target.classList.add('nav-active');
            target.style.backgroundColor = '#dbeafe';
            target.style.outline = '2px solid #0284c7';
            target.style.outlineOffset = '-2px';
            target.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
        return;
    }

    if (event.key === 'Enter') {
        if (dd && dd.style.display !== 'none') {
            const items = Array.from(dd.querySelectorAll('.calc-search-dropdown-item'));
            if (items.length > 0) {
                event.preventDefault();
                const activeItem = dd.querySelector('.calc-search-dropdown-item.nav-active') || items[0];
                if (activeItem) {
                    activeItem.click();
                    dd.style.display = 'none';
                    const mob = document.getElementById('qs-cust-mobile');
                    if (mob) mob.focus();
                }
            }
        }
    }
};


window.renderQuoteCustDropdown = (query) => {
    const dd = document.getElementById('qs-cust-dropdown');
    if (!dd) return;

    const q = (query || '').trim().toLowerCase();
    
    // Combine Store.state.customers and customers from quotations
    const map = new Map();
    (Store.state.customers || []).forEach(c => {
        if (c.name) map.set(c.name.toLowerCase(), c);
    });
    (Store.state.quotations || []).forEach(qQuote => {
        if (qQuote.customer && !map.has(qQuote.customer.toLowerCase())) {
            map.set(qQuote.customer.toLowerCase(), {
                id: qQuote.customerId || '',
                name: qQuote.customer,
                mobile: qQuote.customerPhone || '',
                place: (qQuote.customerAddress || '').split(',')[0] || '',
                city: '',
                pincode: ''
            });
        }
    });

    const allCusts = Array.from(map.values());
    let filtered = [];
    if (!q) {
        filtered = allCusts.slice(0, 6);
    } else {
        filtered = allCusts.filter(c => {
            return (c.name || '').toLowerCase().includes(q) ||
                   (c.mobile || '').includes(q) ||
                   (c.place || '').toLowerCase().includes(q);
        }).slice(0, 8);
    }

    if (filtered.length === 0) {
        dd.style.display = 'none';
        return;
    }

    let html = `
        <div style="padding: 5px 10px; background: #f8fafc; font-size: 0.72rem; font-weight: 800; color: #475569; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between;">
            <span>Verified Customers</span>
            <span style="font-size: 0.68rem; color: #0284c7; font-weight: 700;">Click to autofill</span>
        </div>
    `;

    window._activeQuoteCustMatches = filtered;
    filtered.forEach((c, idx) => {
        const addrDisplay = [c.place, c.city].filter(Boolean).join(', ') || c.address || '';
        html += `
            <div 
                onclick="window.autofillQuoteWizardCustomerByIndex(${idx})"
                class="calc-search-dropdown-item"
                style="padding: 7px 10px; border-bottom: 1px solid #f1f5f9; cursor: pointer; text-align: left;"
            >
                <div style="font-weight: 700; font-size: 0.84rem; color: #0f172a;">${c.name}</div>
                <div style="font-size: 0.72rem; color: #64748b; margin-top: 1px;">
                    ${c.mobile ? '📞 ' + c.mobile : ''} ${addrDisplay ? '• 📍 ' + addrDisplay : ''}
                </div>
            </div>
        `;
    });

    dd.innerHTML = html;
    dd.style.display = 'block';
};

window.autofillQuoteWizardCustomerByIndex = (idx) => {
    const list = window._activeQuoteCustMatches || [];
    const c = list[idx];
    if (c) window.autofillQuoteWizardCustomer(c);
};

window.autofillQuoteWizardCustomer = (c) => {
    if (!c) return;
    let name = c.name || '';
    let mobile = c.mobile || c.phone || '';
    let place = c.place || '';
    let city = c.city || '';
    let pin = c.pincode || c.pin || '';

    // Smart address parser if place/city/pincode are stored combined in c.address
    if (c.address) {
        const pinMatch = c.address.match(/\b\d{6}\b/);
        if (pinMatch && !pin) pin = pinMatch[0];

        const cleanAddr = c.address.replace(/\b\d{6}\b/, '').replace(/[-–]/g, '').trim();
        const parts = cleanAddr.split(',').map(s => s.trim()).filter(Boolean);
        if (!place && parts.length > 0) place = parts[0];
        if (!city && parts.length > 1) city = parts[1];
        if (!city && parts.length === 1) city = parts[0];
    }
    if (!pin) pin = '673001'; // Default valid Kerala postal code fallback
    if (!city && place) city = place;

    const n = document.getElementById('qs-cust-name');
    const m = document.getElementById('qs-cust-mobile');
    const p = document.getElementById('qs-cust-place');
    const ci = document.getElementById('qs-cust-city');
    const pi = document.getElementById('qs-cust-pin');

    if (n) n.value = name;
    if (m) m.value = mobile;
    if (p) p.value = place;
    if (ci) ci.value = city;
    if (pi) pi.value = pin;

    if (Store.state.quoteStudio?.customer) {
        Store.state.quoteStudio.customer.name = name;
        Store.state.quoteStudio.customer.mobile = mobile;
        Store.state.quoteStudio.customer.place = place;
        Store.state.quoteStudio.customer.city = city;
        Store.state.quoteStudio.customer.pincode = pin;
        Store.state.quoteStudio.customer.id = c.id || '';
    }

    const dd = document.getElementById('qs-cust-dropdown');
    if (dd) dd.style.display = 'none';
};

// Unified Direct-Typing Searchable Combobox System
const escapeHtmlAttr = (str) => {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
};

// Prefix match helper: strictly matches query from start of name/ID
window.matMatchesPrefix = (query, name, id) => {
    if (!query) return true;
    const norm = s => (s || '').toLowerCase().trim();
    // Compact: normalize * and × to x, remove spaces, quotes, hyphens, underscores
    const compact = s => norm(s).replace(/[*×]/g, 'x').replace(/[\s\-_"']/g, '');

    const qRaw = norm(query);
    const qComp = compact(query);
    if (!qComp && !qRaw) return true;

    const nRaw = norm(name);
    const nComp = compact(name);
    const idRaw = norm(id);
    const idComp = compact(id);

    // 1. Raw startsWith check on name or ID
    if (nRaw.startsWith(qRaw) || idRaw.startsWith(qRaw)) return true;

    // 2. Compact startsWith check on name or ID (e.g. "4*2.5" matches "4x2.5", "1x1" matches '1" x 1"')
    if (qComp && (nComp.startsWith(qComp) || idComp.startsWith(qComp))) return true;

    return false;
};

window.openMatCombobox = (boxId, inputEl) => {
    const root = document.getElementById(boxId);
    if (!root) return;

    // Close all other open combobox dropdowns
    document.querySelectorAll('.mat-combobox-dropdown').forEach(dd => {
        if (dd.id !== `dropdown-${boxId}`) {
            dd.style.display = 'none';
        }
    });

    const dd = document.getElementById(`dropdown-${boxId}`);
    if (dd) {
        dd.style.display = 'flex';
        window.filterMatCombobox(boxId, '');
        const list = root.querySelector('.mat-combobox-list');
        if (list) {
            const sel = list.querySelector('.mat-combobox-opt.selected');
            if (sel) {
                list.querySelectorAll('.mat-combobox-opt').forEach(o => o.classList.remove('nav-active'));
                sel.classList.add('nav-active');
                sel.style.backgroundColor = '#dbeafe';
                sel.style.outline = '2px solid #0284c7';
                sel.style.outlineOffset = '-2px';
                sel.scrollIntoView({ block: 'nearest' });
            }
        }
        if (inputEl) {
            setTimeout(() => inputEl.select(), 10);
        }
    }
};

window.toggleMatCombobox = (boxId, event) => {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    const root = document.getElementById(boxId);
    if (!root) return;
    const dd = document.getElementById(`dropdown-${boxId}`);
    if (!dd) return;

    const isVisible = dd.style.display === 'flex';
    if (isVisible) {
        dd.style.display = 'none';
    } else {
        const inp = root.querySelector('.mat-combobox-input');
        window.openMatCombobox(boxId, inp);
    }
};

window.filterMatCombobox = (boxId, query) => {
    const root = document.getElementById(boxId);
    if (!root) return;
    const list = root.querySelector('.mat-combobox-list');
    if (!list) return;

    const options = list.querySelectorAll('.mat-combobox-opt');
    let visibleCount = 0;
    let firstVisibleOpt = null;

    options.forEach(opt => {
        opt.classList.remove('nav-active');
        opt.style.outline = 'none';
        const isSel = opt.classList.contains('selected');
        const isNone = opt.getAttribute('data-id') === 'none';
        opt.style.backgroundColor = isSel ? (isNone ? '#f0fdf4' : '#e0f2fe') : 'transparent';

        const id = opt.getAttribute('data-id') || '';
        const name = opt.getAttribute('data-name') || '';

        if (!query || window.matMatchesPrefix(query, name, id)) {
            opt.style.display = 'flex';
            visibleCount++;
            if (!firstVisibleOpt) firstVisibleOpt = opt;
        } else {
            opt.style.display = 'none';
        }
    });

    if (query && firstVisibleOpt) {
        firstVisibleOpt.classList.add('nav-active');
        firstVisibleOpt.style.backgroundColor = '#dbeafe';
        firstVisibleOpt.style.outline = '2px solid #0284c7';
        firstVisibleOpt.style.outlineOffset = '-2px';
    }

    let noResults = list.querySelector('.mat-no-results');
    if (visibleCount === 0) {
        if (!noResults) {
            noResults = document.createElement('div');
            noResults.className = 'mat-no-results';
            noResults.style.cssText = 'padding: 12px; text-align: center; color: #64748b; font-size: 0.78rem; font-weight: 600;';
            list.appendChild(noResults);
        }
        noResults.innerText = `No materials matching "${query}"`;
        noResults.style.display = 'block';
    } else if (noResults) {
        noResults.style.display = 'none';
    }
};

window.selectMatComboboxOption = (optEl, boxId) => {
    if (!optEl) return;
    const id = optEl.getAttribute('data-id') || '';
    const name = optEl.getAttribute('data-name') || '';
    const rate = optEl.getAttribute('data-rate') || 0;
    window.selectMatComboboxItem(boxId, id, name, rate);
};

window.selectMatComboboxItem = (boxId, id, name, rate) => {
    const root = document.getElementById(boxId);
    if (!root) return;

    const hiddenInp = root.querySelector('input[type="hidden"]');
    const visibleInp = root.querySelector('.mat-combobox-input');
    const displayLabel = id === 'none' ? '-- None (Not Included) --' : `${name} (₹${rate})`;

    if (hiddenInp) hiddenInp.value = id;
    if (visibleInp) {
        visibleInp.value = displayLabel;
        visibleInp.setAttribute('data-selected-id', id);
        visibleInp.setAttribute('data-selected-name', displayLabel);
        visibleInp.title = displayLabel;
    }

    const dd = document.getElementById(`dropdown-${boxId}`);
    if (dd) dd.style.display = 'none';

    // Highlight selected
    root.querySelectorAll('.mat-combobox-opt').forEach(opt => {
        const optId = opt.getAttribute('data-id');
        const isSel = (optId === id);
        if (isSel) {
            opt.classList.add('selected');
            opt.style.backgroundColor = (optId === 'none') ? '#f0fdf4' : '#e0f2fe';
        } else {
            opt.classList.remove('selected');
            opt.style.backgroundColor = 'transparent';
        }
        opt.classList.remove('nav-active');
        opt.style.outline = 'none';
    });

    // Dispatch update based on context
    if (boxId.startsWith('qs-mat-root-')) {
        const key = boxId.replace('qs-mat-root-', '');
        if (Store.state.quoteStudio?.materials) {
            Store.state.quoteStudio.materials[key] = id;
        }
    } else if (boxId.startsWith('bar-mat-root-quick-')) {
        const catKey = boxId.replace('bar-mat-root-quick-', '');
        window.updateGrid('mat_' + catKey, id);
    } else if (boxId.startsWith('bar-mat-root-studio-')) {
        const catKey = boxId.replace('bar-mat-root-studio-', '');
        window.updateStudioGrid('mat_' + catKey, id);
    }
};

window.handleMatComboboxKey = (boxId, event) => {
    const root = document.getElementById(boxId);
    if (!root) return;
    const dd = document.getElementById(`dropdown-${boxId}`);
    const inp = root.querySelector('.mat-combobox-input');
    const list = root.querySelector('.mat-combobox-list');

    if (event.key === 'Escape') {
        if (dd) dd.style.display = 'none';
        if (inp) {
            inp.value = inp.getAttribute('data-selected-name') || '';
            inp.blur();
        }
        return;
    }

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        if (!dd) return;

        // If dropdown is closed, open it first!
        if (dd.style.display !== 'flex') {
            window.openMatCombobox(boxId, inp);
        }

        if (!list) return;
        const allOpts = Array.from(list.querySelectorAll('.mat-combobox-opt'));
        const visibleOpts = allOpts.filter(o => o.style.display !== 'none' && window.getComputedStyle(o).display !== 'none');
        if (visibleOpts.length === 0) return;

        let activeIdx = visibleOpts.findIndex(o => o.classList.contains('nav-active'));

        if (event.key === 'ArrowDown') {
            if (activeIdx === -1) {
                const selIdx = visibleOpts.findIndex(o => o.classList.contains('selected'));
                activeIdx = (selIdx >= 0 && selIdx < visibleOpts.length - 1) ? selIdx + 1 : 0;
            } else {
                activeIdx = (activeIdx + 1) % visibleOpts.length;
            }
        } else if (event.key === 'ArrowUp') {
            if (activeIdx === -1) {
                const selIdx = visibleOpts.findIndex(o => o.classList.contains('selected'));
                activeIdx = (selIdx > 0) ? selIdx - 1 : visibleOpts.length - 1;
            } else {
                activeIdx = (activeIdx - 1 + visibleOpts.length) % visibleOpts.length;
            }
        }

        allOpts.forEach(o => {
            o.classList.remove('nav-active');
            const isSel = o.classList.contains('selected');
            const isNone = o.getAttribute('data-id') === 'none';
            o.style.backgroundColor = isSel ? (isNone ? '#f0fdf4' : '#e0f2fe') : 'transparent';
            o.style.outline = 'none';
        });

        const target = visibleOpts[activeIdx];
        if (target) {
            target.classList.add('nav-active');
            target.style.backgroundColor = '#dbeafe';
            target.style.outline = '2px solid #0284c7';
            target.style.outlineOffset = '-2px';
            target.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
        return;
    }

    if (event.key === 'Enter') {
        event.preventDefault();
        if (!list) return;
        const allOpts = Array.from(list.querySelectorAll('.mat-combobox-opt'));
        const visibleOpts = allOpts.filter(o => o.style.display !== 'none' && window.getComputedStyle(o).display !== 'none');
        if (visibleOpts.length === 0) return;

        const activeOpt = visibleOpts.find(o => o.classList.contains('nav-active')) || visibleOpts[0];
        if (activeOpt) {
            activeOpt.click();
            if (inp) inp.blur();
        }
    }
};


// Global click outside listener
if (!window._calcSearchClickListenerAttached) {
    window._calcSearchClickListenerAttached = true;
    document.addEventListener('click', (e) => {
        const bar = document.getElementById('calc-search-bar');
        const dd = document.getElementById('calc-search-dropdown');
        if (dd && bar && !bar.contains(e.target) && !dd.contains(e.target)) {
            dd.style.display = 'none';
        }

        const qBar = document.getElementById('qs-cust-name');
        const qDd = document.getElementById('qs-cust-dropdown');
        if (qDd && qBar && !qBar.contains(e.target) && !qDd.contains(e.target)) {
            qDd.style.display = 'none';
        }

        // Close any open combobox dropdowns if clicked outside
        if (!e.target.closest('.mat-combobox-root') && !e.target.closest('.mat-combobox-dropdown')) {
            document.querySelectorAll('.mat-combobox-dropdown').forEach(d => {
                d.style.display = 'none';
            });
            // Reset input values to selected if left uncommitted
            document.querySelectorAll('.mat-combobox-input').forEach(inp => {
                const sel = inp.getAttribute('data-selected-name');
                if (sel && inp.value !== sel) {
                    inp.value = sel;
                }
            });
        }
    });
}

// -----------------------------------------------------------------------------------------
// 1. QUICK CALCULATION (Real-Time 2D Studio - Always Starts at 1 Kalli 50x140 cm)
// -----------------------------------------------------------------------------------------

// Global armed command state for Window Studio
window.calcArmedCommand = window.calcArmedCommand || null;
window.calcShortcutSequence = window.calcShortcutSequence || '';
window.calcShortcutTimer = window.calcShortcutTimer || null;

window.armCalcCommand = (cmd, code, title, help) => {
    window.calcArmedCommand = { cmd, code, title, help };
    window.calcShortcutSequence = '';
    const banner = document.getElementById('calc-armed-command-banner');
    if (banner) {
        banner.style.display = 'flex';
        const txt = banner.querySelector('.cmd-text');
        if (txt) txt.innerHTML = `<strong>⚡ ACTIVE COMMAND [${code}]:</strong> ${title} — ${help}`;
    } else {
        Store.notify();
    }
};

window.disarmCalcCommand = () => {
    window.calcArmedCommand = null;
    window.calcShortcutSequence = '';
    const banner = document.getElementById('calc-armed-command-banner');
    if (banner) banner.style.display = 'none';
    else Store.notify();
};

window.updateLaborRate = (key, val) => {
    if (!Store.state.laborRates) Store.state.laborRates = { normalPaneRate: 500, partitionedPaneRate: 800 };
    Store.state.laborRates[key] = parseFloat(val) || 0;
    Store.notify();
};

window.updateFabricationFormulaRate = (key, val) => {
    Store.updateFabricationRate(key, val);
};

window.updateLabourTierRate = (tierKey, val) => {
    Store.updateLabourTier(tierKey, val);
};

window.setTotalPartitions = (deltaOrVal) => {
    window.snapshotCurrentCalc?.();
    const rc = Store.state.rateCalc;
    const g = rc?.grid;
    if (!g) return;
    if (!g.panePartitions || g.panePartitions.length !== g.cols) {
        g.panePartitions = Array(g.cols).fill(0);
    }
    let currentTotal = g.panePartitions.reduce((s, p) => s + (parseInt(p) || 0), 0);
    let target = 0;
    if (deltaOrVal === '+1' || deltaOrVal === 1) {
        target = currentTotal + 1;
    } else if (deltaOrVal === '-1' || deltaOrVal === -1) {
        target = Math.max(0, currentTotal - 1);
    } else {
        target = Math.max(0, parseInt(deltaOrVal) || 0);
    }
    // Distribute partitions across panes
    if (target === 0) {
        g.panePartitions = Array(g.cols).fill(0);
    } else {
        const perPane = Math.floor(target / g.cols);
        const remainder = target % g.cols;
        g.panePartitions = Array(g.cols).fill(perPane);
        for (let i = 0; i < remainder; i++) {
            g.panePartitions[i] += 1;
        }
    }
    Store.notify();
};

window.sendCalcToQuotation = () => {
    const rc = Store.state.rateCalc;
    const g = rc?.grid || {};
    const totalParts = g.panePartitions ? g.panePartitions.reduce((s, p) => s + (parseInt(p) || 0), 0) : 0;
    const fabCalc = calculateWindowFabrication({
        width: g.totalW,
        height: g.totalH,
        unit: g.unit,
        bays: g.cols,
        partitions: totalParts,
        panePartitions: g.panePartitions,
        shuttersCount: g.cols,
        profitMarginPercent: rc?.params?.profitMarginPercent ?? 15
    });

    const newItem = {
        id: `WIN-ITEM-${Date.now().toString().slice(-6)}`,
        productId: `WIN-${fabCalc.bays}K-${Math.round(fabCalc.widthCm)}x${Math.round(fabCalc.heightCm)}`,
        name: `Window ${fabCalc.bays}-Bay (${fabCalc.widthCm}x${fabCalc.heightCm} cm)`,
        category: 'Window',
        description: `${fabCalc.bays}-Bay Window (${fabCalc.rawW}x${fabCalc.rawH} ${fabCalc.unit}) • ${fabCalc.totalPipesCount} Pipes, ${fabCalc.totalHoles} Holes Punching, ${fabCalc.totalProfileWeightKg} kg Profile`,
        dimensions: `${fabCalc.rawW} x ${fabCalc.rawH} ${fabCalc.unit}`,
        width: fabCalc.rawW,
        height: fabCalc.rawH,
        unit: fabCalc.unit,
        bays: fabCalc.bays,
        partitions: fabCalc.partitions,
        pipesCount: fabCalc.totalPipesCount,
        holesCount: fabCalc.totalHoles,
        profileWeightKg: fabCalc.totalProfileWeightKg,
        qty: 1,
        rate: fabCalc.grandTotal,
        amount: fabCalc.grandTotal,
        unitPrice: fabCalc.grandTotal,
        total: fabCalc.grandTotal,
        bom: {
            outerProfile: { lengthM: fabCalc.outerPerimeterM, weightKg: fabCalc.outerWeightKg, cost: fabCalc.outerProfileCost },
            innerProfile: { lengthM: fabCalc.totalInnerProfileLengthM, weightKg: fabCalc.innerWeightKg, cost: fabCalc.innerProfileCost },
            pipes: { count: fabCalc.totalPipesCount, lengthM: fabCalc.totalPipeLengthM, cost: fabCalc.pipeCost },
            punching: { faces: fabCalc.intersectingProfileFaces, holes: fabCalc.totalHoles, cost: fabCalc.punchingCost },
            hinges: { count: fabCalc.totalHingesCount, cost: fabCalc.hingesCost },
            paint: { areaSqM: fabCalc.surfaceAreaSqM, liters: fabCalc.paintLiters, cost: fabCalc.paintCost },
            labour: { total: fabCalc.totalLabourCost, tiers: fabCalc.labourTiers },
            bomItems: fabCalc.bomItems,
            categorySubtotals: fabCalc.categorySubtotals,
            subtotal: fabCalc.subtotalCost,
            profitMarginPercent: fabCalc.profitMarginPercent,
            grandTotal: fabCalc.grandTotal
        }
    };

    if (!Store.state.currentQuoteDraft) {
        Store.state.currentQuoteDraft = { customer: '', customerId: '', customerPhone: '', customerAddress: '', items: [] };
    }
    Store.state.currentQuoteDraft.items.push(newItem);
    Store.saveState();
    Store.notify();

    if (typeof window.showStudioToast === 'function') {
        window.showStudioToast(`✅ Window ${fabCalc.bays}-Bay added to Quotation Draft! (₹${fabCalc.grandTotal.toLocaleString('en-IN')})`);
    } else {
        alert(`✅ Window ${fabCalc.bays}-Bay saved to Quotation Draft! (₹${fabCalc.grandTotal.toLocaleString('en-IN')})`);
    }
};

window.saveCalcRecord = () => {
    const rc = Store.state.rateCalc;
    const g = rc?.grid || {};
    const totalParts = g.panePartitions ? g.panePartitions.reduce((s, p) => s + (parseInt(p) || 0), 0) : 0;
    const fabCalc = calculateWindowFabrication({
        width: g.totalW,
        height: g.totalH,
        unit: g.unit,
        bays: g.cols,
        partitions: totalParts,
        panePartitions: g.panePartitions,
        shuttersCount: g.cols,
        profitMarginPercent: rc?.params?.profitMarginPercent ?? 15
    });

    const calcId = `CALC-${Date.now().toString().slice(-6)}`;
    const record = {
        id: calcId,
        timestamp: new Date().toISOString(),
        title: `${fabCalc.bays}-Bay Window (${fabCalc.widthCm}x${fabCalc.heightCm} cm)`,
        dimensions: `${fabCalc.rawW} x ${fabCalc.rawH} ${fabCalc.unit}`,
        bays: fabCalc.bays,
        partitions: fabCalc.partitions,
        pipesCount: fabCalc.totalPipesCount,
        holesCount: fabCalc.totalHoles,
        profileWeightKg: fabCalc.totalProfileWeightKg,
        materialCost: fabCalc.totalMaterialCost,
        labourCost: fabCalc.totalLabourCost,
        grandTotal: fabCalc.grandTotal,
        fabCalc: fabCalc
    };

    Store.saveFabricationCalculation(record);

    if (typeof window.showStudioToast === 'function') {
        window.showStudioToast(`💾 Calculation ${calcId} saved successfully! (₹${fabCalc.grandTotal.toLocaleString('en-IN')})`);
    } else {
        alert(`💾 Calculation saved as ${calcId}!`);
    }
};

window.loadBenchmarkPreset = () => {
    window.snapshotCurrentCalc?.();
    const rc = Store.state.rateCalc;
    if (!rc || !rc.grid) return;
    const g = rc.grid;
    g.cols = 3;
    g.unit = 'cm';
    g.totalW = 150;
    g.totalH = 160;
    g.paneWidths = [50, 50, 50];
    g.panePartitions = [0, 0, 0];
    g.partitionPos = ['top', 'top', 'top'];
    g.paneTubeCounts = [null, null, null];
    if (rc.materials) {
        rc.materials.panel = 'none';
    }
    if (rc.params) {
        rc.params.profitMarginPercent = 15;
    }
    Store.notify();
    if (typeof window.showStudioToast === 'function') {
        window.showStudioToast(`🎯 Loaded benchmark: 3-Bay Window (150 W x 160 H cm, 13 pipes, 78 holes, ₹10,881)`);
    }
};

window.openFabricationRatesModal = () => {
    document.getElementById('fabrication-rates-modal')?.remove();
    const fr = Store.state.fabricationRates || {};
    const lt = fr.labourTiers || {};

    const modal = document.createElement('div');
    modal.id = 'fabrication-rates-modal';
    modal.className = 'modal-backdrop animate-fade-in';
    modal.style.cssText = 'position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.85); z-index:10000; display:flex; align-items:center; justify-content:center; padding:1rem; overflow-y:auto;';

    modal.innerHTML = `
        <div class="glass-panel" style="width: 100%; max-width: 650px; padding: 2rem; background: var(--color-bg-card, #1e1e24); border: 1px solid var(--glass-border); border-radius: 14px; box-shadow: 0 10px 40px rgba(0,0,0,0.6); margin: auto;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; border-bottom: 1px solid var(--glass-border); padding-bottom: 0.75rem;">
                <div>
                    <h3 style="margin: 0; display: flex; align-items: center; gap: 0.5rem; font-size: 1.25rem; color: var(--color-text-heading); font-weight: 700;">
                        <i data-lucide="sliders" style="color: var(--color-primary);"></i> Dynamic Material Catalog Rates & Labour Tiers
                    </h3>
                    <p style="margin: 2px 0 0; font-size: 0.78rem; color: var(--color-text-muted);">
                        Configure engineering formula constants, material pricing, and fabrication tiers.
                    </p>
                </div>
                <button onclick="document.getElementById('fabrication-rates-modal').remove()" style="background: none; border: none; color: #888; cursor: pointer; padding: 4px;"><i data-lucide="x"></i></button>
            </div>

            <form onsubmit="window.saveFabricationRatesModal(event)" style="display: flex; flex-direction: column; gap: 1.25rem;">
                
                <!-- Section 1: Material Rates -->
                <div>
                    <div style="font-size: 0.82rem; font-weight: 700; color: #38bdf8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.6rem; display: flex; align-items: center; gap: 6px;">
                        <i data-lucide="layers" style="width: 14px; height: 14px;"></i> 1. Material Rates & Formulas
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">
                        <div>
                            <label style="display: block; font-size: 0.78rem; color: var(--color-text-muted); margin-bottom: 4px; font-weight: 600;">Profile Price (₹ / kg)</label>
                            <input type="number" step="1" id="m-prof-rate" value="${fr.profileKgRate ?? 180}" class="glass-input" style="width: 100%; padding: 6px 10px; font-weight: 700;">
                        </div>
                        <div>
                            <label style="display: block; font-size: 0.78rem; color: var(--color-text-muted); margin-bottom: 4px; font-weight: 600;">Pipe Price (₹ / meter)</label>
                            <input type="number" step="1" id="m-pipe-rate" value="${fr.pipeMeterRate ?? 95}" class="glass-input" style="width: 100%; padding: 6px 10px; font-weight: 700;">
                        </div>
                        <div>
                            <label style="display: block; font-size: 0.78rem; color: var(--color-text-muted); margin-bottom: 4px; font-weight: 600;">Hole Punching Charge (₹ / hole)</label>
                            <input type="number" step="0.5" id="m-hole-rate" value="${fr.holePunchRate ?? 5}" class="glass-input" style="width: 100%; padding: 6px 10px; font-weight: 700;">
                        </div>
                        <div>
                            <label style="display: block; font-size: 0.78rem; color: var(--color-text-muted); margin-bottom: 4px; font-weight: 600;">Unit Hinge Rate (₹ / pcs)</label>
                            <input type="number" step="1" id="m-hinge-rate" value="${fr.unitHingeRate ?? 85}" class="glass-input" style="width: 100%; padding: 6px 10px; font-weight: 700;">
                        </div>
                        <div>
                            <label style="display: block; font-size: 0.78rem; color: var(--color-text-muted); margin-bottom: 4px; font-weight: 600;">Paint Baseline Cost (₹ per 0.70 m²)</label>
                            <input type="number" step="5" id="m-paint-base" value="${fr.paintBaselineCost ?? 150}" class="glass-input" style="width: 100%; padding: 6px 10px; font-weight: 700;">
                        </div>
                        <div>
                            <label style="display: block; font-size: 0.78rem; color: var(--color-text-muted); margin-bottom: 4px; font-weight: 600;">Unit Weight Ratio (kg / meter)</label>
                            <input type="number" step="0.001" id="m-weight-ratio" value="${fr.unitWeightRatioKgPerMeter ?? 2.9167}" class="glass-input" style="width: 100%; padding: 6px 10px; font-weight: 700;">
                        </div>
                    </div>
                </div>

                <!-- Section 2: Labour & Fabrication Charges -->
                <div style="border-top: 1px solid var(--glass-border); padding-top: 1rem;">
                    <div style="font-size: 0.82rem; font-weight: 700; color: #10b981; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.6rem; display: flex; align-items: center; gap: 6px;">
                        <i data-lucide="wrench" style="width: 14px; height: 14px;"></i> 2. Base Labour Tiers
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">
                        <div>
                            <label style="display: block; font-size: 0.78rem; color: var(--color-text-muted); margin-bottom: 4px; font-weight: 600;">Base Single-Panel Assembly (₹)</label>
                            <input type="number" step="10" id="m-lab-base" value="${lt.baseAssembly ?? 150}" class="glass-input" style="width: 100%; padding: 6px 10px; font-weight: 700;">
                        </div>
                        <div>
                            <label style="display: block; font-size: 0.78rem; color: var(--color-text-muted); margin-bottom: 4px; font-weight: 600;">Opening Shutter Fabrication (₹/panel)</label>
                            <input type="number" step="10" id="m-lab-shutter" value="${lt.shutterFabrication ?? 150}" class="glass-input" style="width: 100%; padding: 6px 10px; font-weight: 700;">
                        </div>
                        <div>
                            <label style="display: block; font-size: 0.78rem; color: var(--color-text-muted); margin-bottom: 4px; font-weight: 600;">Partition Insertion Charge (₹/partition)</label>
                            <input type="number" step="5" id="m-lab-part" value="${lt.partitionCharge ?? 50}" class="glass-input" style="width: 100%; padding: 6px 10px; font-weight: 700;">
                        </div>
                        <div>
                            <label style="display: block; font-size: 0.78rem; color: var(--color-text-muted); margin-bottom: 4px; font-weight: 600;">Cutting & Material Handling Surcharge (₹)</label>
                            <input type="number" step="10" id="m-lab-cut" value="${lt.cuttingHandlingSurcharge ?? 150}" class="glass-input" style="width: 100%; padding: 6px 10px; font-weight: 700;">
                        </div>
                    </div>
                </div>

                <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 0.5rem; border-top: 1px solid var(--glass-border); padding-top: 1rem;">
                    <button type="button" onclick="document.getElementById('fabrication-rates-modal').remove()" class="btn btn-secondary" style="padding: 0.5rem 1rem;">Cancel</button>
                    <button type="submit" class="btn btn-primary" style="padding: 0.5rem 1.4rem; font-weight: 700;">Save & Apply Rates</button>
                </div>
            </form>
        </div>
    `;

    document.body.appendChild(modal);
    if (window.lucide) window.lucide.createIcons();
};

window.saveFabricationRatesModal = (e) => {
    e.preventDefault();
    const prof = parseFloat(document.getElementById('m-prof-rate')?.value) || 180;
    const pipe = parseFloat(document.getElementById('m-pipe-rate')?.value) || 95;
    const hole = parseFloat(document.getElementById('m-hole-rate')?.value) || 5;
    const hinge = parseFloat(document.getElementById('m-hinge-rate')?.value) || 85;
    const paint = parseFloat(document.getElementById('m-paint-base')?.value) || 150;
    const ratio = parseFloat(document.getElementById('m-weight-ratio')?.value) || 2.9167;

    const labBase = parseFloat(document.getElementById('m-lab-base')?.value) || 150;
    const labShutter = parseFloat(document.getElementById('m-lab-shutter')?.value) || 150;
    const labPart = parseFloat(document.getElementById('m-lab-part')?.value) || 50;
    const labCut = parseFloat(document.getElementById('m-lab-cut')?.value) || 150;

    Store.updateFabricationRate('profileKgRate', prof);
    Store.updateFabricationRate('pipeMeterRate', pipe);
    Store.updateFabricationRate('holePunchRate', hole);
    Store.updateFabricationRate('unitHingeRate', hinge);
    Store.updateFabricationRate('paintBaselineCost', paint);
    Store.updateFabricationRate('unitWeightRatioKgPerMeter', ratio);

    Store.updateLabourTier('baseAssembly', labBase);
    Store.updateLabourTier('shutterFabrication', labShutter);
    Store.updateLabourTier('partitionCharge', labPart);
    Store.updateLabourTier('cuttingHandlingSurcharge', labCut);

    document.getElementById('fabrication-rates-modal')?.remove();
    if (typeof window.showStudioToast === 'function') {
        window.showStudioToast('✅ Dynamic rates & labour tiers successfully saved!');
    }
};

window.openPartitionPosDropdown = (paneIndex, anchorEl) => {
    window.closePartitionPosDropdown();
    if (!anchorEl) return;
    const isStudio = Store.state.calcTab === 'quotation' && Store.state.quoteStudio?.step === 'editor';
    const targetObj = isStudio ? Store.state.quoteStudio?.currentWindow : Store.state.rateCalc?.grid;
    const curParts = (targetObj?.panePartitions && targetObj.panePartitions[paneIndex]) || 0;

    const rect = anchorEl.getBoundingClientRect();
    const pop = document.createElement('div');
    pop.id = 'calc-partition-pos-popover';
    const popWidth = 230;
    const popLeft = Math.max(10, Math.min(window.innerWidth - popWidth - 10, Math.round(rect.left + (rect.width / 2) - (popWidth / 2))));
    pop.style.cssText = `
        position: fixed;
        left: ${popLeft}px;
        top: ${Math.round(rect.bottom + 4)}px;
        background: #ffffff;
        border: 1.5px solid #0284c7;
        border-radius: 8px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.22);
        z-index: 100080;
        width: ${popWidth}px;
        min-width: ${popWidth}px;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        padding: 5px;
        font-family: var(--font-main, sans-serif);
    `;

    const options = [
        { id: 'quarter', label: '¼ Top Quarter (25%)', shortcut: 'PK', dir: 'horizontal', count: 1 },
        { id: 'top', label: '⬆️ Top Partition (35%)', shortcut: 'PT', dir: 'horizontal', count: 1 },
        { id: 'center', label: '↕️ Middle Partition (50%)', shortcut: 'PM', dir: 'horizontal', count: 1 },
        { id: 'bottom', label: '⬇️ Bottom Partition (65%)', shortcut: 'PB', dir: 'horizontal', count: 1 },
        { id: 'threequarter', label: '¾ Three-Quarter (75%)', shortcut: 'PMK', dir: 'horizontal', count: 1 },
        { id: 'vertical', label: '↔️ Vertical Partition', shortcut: 'PV', dir: 'vertical', count: 1 },
        { id: 'p2', label: '🟰 2 Partitions (Horizontal)', shortcut: '2P', dir: 'horizontal', count: 2 },
        { id: 'p3', label: '☰ 3 Partitions (Horizontal)', shortcut: '3P', dir: 'horizontal', count: 3 },
        { id: 'clear', label: '❌ Remove Partition', shortcut: 'PR', dir: 'none', count: 0 }
    ];

    let activeOptIdx = 0;

    pop.innerHTML = `
        <div style="font-size: 0.68rem; font-weight: 800; color: #475569; padding: 4px 8px 6px; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; letter-spacing: 0.5px;">
            <span>Pane ${paneIndex + 1} Partitions</span>
            <span style="font-size: 0.62rem; color: #94a3b8;">(0 to 5)</span>
        </div>

        <!-- Quick Count Selector Buttons: 0, 1, 2, 3, 4, 5 (Audio) -->
        <div style="padding: 6px 8px; border-bottom: 1px solid #f1f5f9; display: flex; align-items: center; justify-content: space-between;">
            <span style="font-size: 0.68rem; font-weight: 700; color: #64748b;">Count:</span>
            <div style="display: flex; gap: 4px;">
                ${[0, 1, 2, 3, 4, 5].map(n => `
                    <button 
                        type="button" 
                        onclick="window.selectPanePartitionPos(${paneIndex}, '${n === 0 ? 'clear' : 'center'}', 'horizontal', ${n})"
                        style="
                            background: ${curParts === n ? '#0284c7' : '#f1f5f9'};
                            color: ${curParts === n ? '#ffffff' : '#334155'};
                            border: 1px solid ${curParts === n ? '#0284c7' : '#cbd5e1'};
                            border-radius: 4px;
                            padding: 2px 6px;
                            font-size: 0.75rem;
                            font-weight: 800;
                            cursor: pointer;
                            line-height: 1.2;
                            transition: all 0.15s ease;
                        "
                        title="Set ${n} partition${n === 1 ? '' : 's'}"
                    >${n}</button>
                `).join('')}
            </div>
        </div>

        <div style="max-height: 240px; overflow-y: auto; padding-top: 2px;">
            ${options.map((opt, idx) => `
                <div 
                    class="pos-opt-item ${idx === 0 ? 'nav-focus' : ''}" 
                    data-pos="${opt.id}"
                    data-dir="${opt.dir}"
                    data-count="${opt.count}"
                    style="padding: 6px 8px; cursor: pointer; border-radius: 5px; font-size: 0.78rem; font-weight: 700; color: #1e293b; display: flex; justify-content: space-between; align-items: center; transition: all 0.15s ease; background: ${idx === 0 ? '#e0f2fe' : 'transparent'};"
                    onmouseenter="this.style.background='#e0f2fe'; this.style.color='#0284c7'"
                    onmouseleave="if(!this.classList.contains('nav-focus')){ this.style.background='transparent'; this.style.color='#1e293b'; }"
                    onclick="window.selectPanePartitionPos(${paneIndex}, '${opt.id}', '${opt.dir}', ${opt.count})"
                >
                    <span>${opt.label}</span>
                    <span style="font-size: 0.65rem; color: #0284c7; background: #e0f2fe; padding: 2px 5px; border-radius: 4px; font-weight: 800;">${opt.shortcut}</span>
                </div>
            `).join('')}
        </div>
    `;

    document.body.appendChild(pop);

    const keyHandler = (e) => {
        const items = pop.querySelectorAll('.pos-opt-item');
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            activeOptIdx = (activeOptIdx + 1) % items.length;
            items.forEach((it, idx) => {
                it.classList.toggle('nav-focus', idx === activeOptIdx);
                it.style.background = idx === activeOptIdx ? '#e0f2fe' : 'transparent';
                it.style.color = idx === activeOptIdx ? '#0284c7' : '#1e293b';
            });
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            activeOptIdx = (activeOptIdx - 1 + items.length) % items.length;
            items.forEach((it, idx) => {
                it.classList.toggle('nav-focus', idx === activeOptIdx);
                it.style.background = idx === activeOptIdx ? '#e0f2fe' : 'transparent';
                it.style.color = idx === activeOptIdx ? '#0284c7' : '#1e293b';
            });
        } else if (e.key === 'Enter') {
            e.preventDefault();
            const chosen = items[activeOptIdx]?.getAttribute('data-pos') || 'top';
            const chosenDir = items[activeOptIdx]?.getAttribute('data-dir') || 'horizontal';
            const chosenCount = parseInt(items[activeOptIdx]?.getAttribute('data-count')) || 1;
            window.selectPanePartitionPos(paneIndex, chosen, chosenDir, chosenCount);
            cleanup();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            cleanup();
        }
    };

    const cleanup = () => {
        window.removeEventListener('keydown', keyHandler);
        pop.remove();
    };

    window.addEventListener('keydown', keyHandler);

    setTimeout(() => {
        const docClickHandler = (e) => {
            if (!pop.contains(e.target) && e.target !== anchorEl && !anchorEl.contains(e.target)) {
                cleanup();
                document.removeEventListener('click', docClickHandler);
            }
        };
        document.addEventListener('click', docClickHandler);
    }, 50);
};

window.closePartitionPosDropdown = () => {
    const pop = document.getElementById('calc-partition-pos-popover');
    if (pop) pop.remove();
};

window.selectPanePartitionPos = (paneIndex, pos, dir = 'horizontal', count = 1) => {
    window.closePartitionPosDropdown();
    if (pos === 'clear' || dir === 'none' || count === 0) {
        window.removePanePartition(paneIndex);
        return;
    }
    const isStudio = Store.state.calcTab === 'quotation' && Store.state.quoteStudio?.step === 'editor';
    if (isStudio) {
        if (typeof window.setStudioPanePartitionPos === 'function') {
            window.setStudioPanePartitionPos(paneIndex, pos === 'vertical' ? 'center' : (count > 1 ? 'center' : pos), dir, count);
        }
    } else {
        const targetObj = Store.state.rateCalc?.grid;
        if (targetObj) {
            if (!targetObj.partitionDir) targetObj.partitionDir = Array(targetObj.cols).fill('horizontal');
            targetObj.partitionDir[paneIndex] = dir;
        }
        window.setPanePartitionPos(paneIndex, pos === 'vertical' ? 'center' : (count > 1 ? 'center' : pos), dir, count);
    }
};

window.setPanePartitionCount = (index, count) => {
    if (typeof snapshotCalc === 'function') snapshotCalc();
    const isStudio = Store.state.calcTab === 'quotation' && Store.state.quoteStudio?.step === 'editor';
    const target = isStudio ? Store.state.quoteStudio?.currentWindow : Store.state.rateCalc?.grid;
    if (!target) return;
    if (!target.panePartitions) target.panePartitions = Array(target.cols).fill(0);
    target.activePaneIndex = index;
    target.panePartitions[index] = Math.max(0, Math.min(10, parseInt(count) || 0));
    Store.notify();
};

window.setPanePartitionPos = (index, pos, dir = null, count = null) => {
    if (typeof snapshotCalc === 'function') snapshotCalc();
    const isStudio = Store.state.calcTab === 'quotation' && Store.state.quoteStudio?.step === 'editor';
    const target = isStudio ? Store.state.quoteStudio?.currentWindow : Store.state.rateCalc?.grid;
    if (!target) return;
    if (!target.partitionPos) target.partitionPos = Array(target.cols).fill('top');
    if (!target.partitionDir) target.partitionDir = Array(target.cols).fill('horizontal');
    if (!target.panePartitions) target.panePartitions = Array(target.cols).fill(0);
    target.activePaneIndex = index;
    if (count === 0 || pos === 'clear') {
        target.panePartitions[index] = 0;
        if (target.partitionHeights) delete target.partitionHeights[index];
        if (target.subPartitions) {
            delete target.subPartitions[`${index}_0`];
            delete target.subPartitions[`${index}_1`];
        }
        window.showStudioToast(`Partition removed from Pane ${index + 1}`);
        Store.notify();
        return;
    }
    if (count !== null && count !== undefined) {
        target.panePartitions[index] = Math.max(0, Math.min(10, parseInt(count) || 0));
    } else if ((target.panePartitions[index] || 0) === 0) {
        target.panePartitions[index] = 1;
    }
    if (target.partitionHeights) delete target.partitionHeights[index];
    if (dir) target.partitionDir[index] = dir;
    else if (pos === 'vertical') {
        target.partitionDir[index] = 'vertical';
        pos = 'center';
    }
    target.partitionPos[index] = pos;
    Store.notify();
};

window.toggleGrillOrientation = (paneIndex) => {
    const isStudio = Store.state.calcTab === 'quotation' && Store.state.quoteStudio?.step === 'editor';
    const targetObj = isStudio ? Store.state.quoteStudio?.currentWindow : Store.state.rateCalc?.grid;
    if (!targetObj) return;
    if (!targetObj.paneTubeOrientations) targetObj.paneTubeOrientations = Array(targetObj.cols).fill('horizontal');
    const cur = targetObj.paneTubeOrientations[paneIndex] || 'horizontal';
    const next = cur === 'horizontal' ? 'vertical' : 'horizontal';
    targetObj.paneTubeOrientations[paneIndex] = next;
    Store.notify();
    window.showStudioToast(`Pane ${paneIndex + 1} grill rotated to ${next.toUpperCase()}`);
};

window.promptGlobalPipeCount = () => {
    const isStudio = Store.state.calcTab === 'quotation' && Store.state.quoteStudio?.step === 'editor';
    const targetObj = isStudio ? Store.state.quoteStudio?.currentWindow : Store.state.rateCalc?.grid;
    if (!targetObj) return;

    const ans = prompt(`Enter number of pipes / tubes for window (applies to each pane):`, '10');
    if (ans !== null && !isNaN(parseInt(ans))) {
        if (typeof window.snapshotCurrentCalc === 'function') window.snapshotCurrentCalc();
        const num = Math.max(0, parseInt(ans));
        targetObj.paneTubeCounts = Array(targetObj.cols).fill(num);
        Store.notify();
        window.showStudioToast(`All ${targetObj.cols} panes set to ${num} pipes`);
    }
};

window.promptPanePipeCount = (paneIndex) => {
    const isStudio = Store.state.calcTab === 'quotation' && Store.state.quoteStudio?.step === 'editor';
    const targetObj = isStudio ? Store.state.quoteStudio?.currentWindow : Store.state.rateCalc?.grid;
    if (!targetObj) return;

    const cur = targetObj.paneTubeCounts?.[paneIndex] ?? '';
    const ans = prompt(`Enter number of pipes for Pane ${paneIndex + 1}:`, cur === null ? '10' : String(cur));
    if (ans !== null && !isNaN(parseInt(ans))) {
        if (typeof window.snapshotCurrentCalc === 'function') window.snapshotCurrentCalc();
        if (!targetObj.paneTubeCounts) targetObj.paneTubeCounts = Array(targetObj.cols).fill(null);
        targetObj.paneTubeCounts[paneIndex] = Math.max(0, parseInt(ans));
        Store.notify();
        window.showStudioToast(`Pane ${paneIndex + 1} set to ${targetObj.paneTubeCounts[paneIndex]} pipes`);
    }
};

window.handleSubPaneClick = (paneIndex, subIndex = 0) => {
    const isStudio = Store.state.calcTab === 'quotation' && Store.state.quoteStudio?.step === 'editor';
    const targetObj = isStudio ? Store.state.quoteStudio?.currentWindow : Store.state.rateCalc?.grid;
    if (!targetObj) return;

    if (!targetObj.subOrientations) targetObj.subOrientations = {};
    if (!targetObj.subTubeCounts) targetObj.subTubeCounts = {};

    if (window.calcArmedCommand) {
        const cmd = window.calcArmedCommand.cmd;
        if (typeof window.snapshotCurrentCalc === 'function') window.snapshotCurrentCalc();

        if (cmd === 'PARTITION_QUARTER') {
            if (!targetObj.panePartitions) targetObj.panePartitions = Array(targetObj.cols).fill(0);
            if (!targetObj.partitionPos) targetObj.partitionPos = Array(targetObj.cols).fill('top');
            if (!targetObj.partitionDir) targetObj.partitionDir = Array(targetObj.cols).fill('horizontal');
            targetObj.panePartitions[paneIndex] = 1;
            targetObj.partitionDir[paneIndex] = 'horizontal';
            targetObj.partitionPos[paneIndex] = 'quarter';
            if (targetObj.partitionHeights) delete targetObj.partitionHeights[paneIndex];
            window.showStudioToast(`Quarter partition (25%) applied to Pane ${paneIndex + 1}`);
        } else if (cmd === 'PARTITION_TOP') {
            if (!targetObj.panePartitions) targetObj.panePartitions = Array(targetObj.cols).fill(0);
            if (!targetObj.partitionPos) targetObj.partitionPos = Array(targetObj.cols).fill('top');
            if (!targetObj.partitionDir) targetObj.partitionDir = Array(targetObj.cols).fill('horizontal');
            targetObj.panePartitions[paneIndex] = 1;
            targetObj.partitionDir[paneIndex] = 'horizontal';
            targetObj.partitionPos[paneIndex] = 'top';
            if (targetObj.partitionHeights) delete targetObj.partitionHeights[paneIndex];
            window.showStudioToast(`Top partition applied to Pane ${paneIndex + 1}`);
        } else if (cmd === 'PARTITION_MIDDLE') {
            if (!targetObj.panePartitions) targetObj.panePartitions = Array(targetObj.cols).fill(0);
            if (!targetObj.partitionPos) targetObj.partitionPos = Array(targetObj.cols).fill('top');
            if (!targetObj.partitionDir) targetObj.partitionDir = Array(targetObj.cols).fill('horizontal');
            targetObj.panePartitions[paneIndex] = 1;
            targetObj.partitionDir[paneIndex] = 'horizontal';
            targetObj.partitionPos[paneIndex] = 'center';
            window.showStudioToast(`Middle partition applied to Pane ${paneIndex + 1}`);
        } else if (cmd === 'PARTITION_BOTTOM') {
            if (!targetObj.panePartitions) targetObj.panePartitions = Array(targetObj.cols).fill(0);
            if (!targetObj.partitionPos) targetObj.partitionPos = Array(targetObj.cols).fill('top');
            if (!targetObj.partitionDir) targetObj.partitionDir = Array(targetObj.cols).fill('horizontal');
            targetObj.panePartitions[paneIndex] = 1;
            targetObj.partitionDir[paneIndex] = 'horizontal';
            targetObj.partitionPos[paneIndex] = 'bottom';
            window.showStudioToast(`Bottom partition applied to Pane ${paneIndex + 1}`);
        } else if (cmd === 'PARTITION_VERTICAL') {
            if ((targetObj.panePartitions?.[paneIndex] || 0) > 0 && targetObj.partitionDir?.[paneIndex] === 'horizontal') {
                if (!targetObj.subPartitions) targetObj.subPartitions = {};
                const subKey = `${paneIndex}_${subIndex}`;
                targetObj.subPartitions[subKey] = targetObj.subPartitions[subKey] === 'vertical' ? 'none' : 'vertical';
                const subLabel = subIndex === 0 ? 'Top Opening' : 'Bottom Opening';
                window.showStudioToast(`Vertical divider ${targetObj.subPartitions[subKey] === 'vertical' ? 'added to' : 'removed from'} Pane ${paneIndex + 1} ${subLabel}`);
            } else {
                if (!targetObj.panePartitions) targetObj.panePartitions = Array(targetObj.cols).fill(0);
                if (!targetObj.partitionPos) targetObj.partitionPos = Array(targetObj.cols).fill('center');
                if (!targetObj.partitionDir) targetObj.partitionDir = Array(targetObj.cols).fill('horizontal');
                targetObj.panePartitions[paneIndex] = 1;
                targetObj.partitionDir[paneIndex] = 'vertical';
                targetObj.partitionPos[paneIndex] = 'center';
                window.showStudioToast(`Vertical partition (PV) applied to Pane ${paneIndex + 1}`);
            }
        } else if (cmd === 'ROTATE_GRILL') {
            const key = `${paneIndex}_${subIndex}`;
            const cur = targetObj.subOrientations[key] || (targetObj.paneTubeOrientations && targetObj.paneTubeOrientations[paneIndex]) || 'horizontal';
            const next = cur === 'horizontal' ? 'vertical' : 'horizontal';
            targetObj.subOrientations[key] = next;
            const isVert = (targetObj.panePartitions?.[paneIndex] || 0) > 0 && targetObj.partitionDir?.[paneIndex] === 'vertical';
            const subLabel = (targetObj.panePartitions?.[paneIndex] || 0) > 0 
                ? (isVert ? (subIndex === 0 ? 'Left Opening' : 'Right Opening') : (subIndex === 0 ? 'Top Opening' : 'Main Opening')) 
                : '';
            window.showStudioToast(`Pane ${paneIndex + 1} ${subLabel} grill rotated to ${next.toUpperCase()}`);
        } else if (cmd === 'SET_PANE_PIPES') {
            window.promptSubPipeCount(paneIndex, subIndex);
        } else if (cmd === 'REMOVE_PIPES') {
            targetObj.subTubeCounts[`${paneIndex}_${subIndex}`] = 0;
            const subLabel = (targetObj.panePartitions?.[paneIndex] || 0) > 0 ? (subIndex === 0 ? 'Top Opening' : 'Main Opening') : '';
            window.showStudioToast(`Pipes removed from Pane ${paneIndex + 1} ${subLabel}`);
        } else if (cmd === 'REMOVE_PARTITION') {
            if (targetObj.panePartitions) targetObj.panePartitions[paneIndex] = 0;
            if (targetObj.partitionPos) targetObj.partitionPos[paneIndex] = 'top';
            if (targetObj.partitionDir) targetObj.partitionDir[paneIndex] = 'horizontal';
            if (targetObj.partitionHeights) delete targetObj.partitionHeights[paneIndex];
            if (targetObj.subPartitions) {
                delete targetObj.subPartitions[`${paneIndex}_0`];
                delete targetObj.subPartitions[`${paneIndex}_1`];
            }
            window.showStudioToast(`Partition removed from Pane ${paneIndex + 1}`);
        } else if (cmd === 'RESET_PIPES') {
            const key = `${paneIndex}_${subIndex}`;
            if (targetObj.subOrientations) delete targetObj.subOrientations[key];
            if (targetObj.subTubeCounts) delete targetObj.subTubeCounts[key];
            if (targetObj.subPartitions) delete targetObj.subPartitions[key];
            window.showStudioToast(`Pipes reset to default in Pane ${paneIndex + 1}`);
        }

        window.disarmCalcCommand();
        Store.notify();
        return;
    }

    targetObj.activePaneIndex = paneIndex;
    targetObj.activeSubIndex = subIndex;
    Store.notify();
};
window.handlePaneClick = (paneIndex) => window.handleSubPaneClick(paneIndex, 0);

window.removePanePartition = (paneIndex) => {
    const isStudio = Store.state.calcTab === 'quotes' || (Store.state.calcTab === 'quotation' && Store.state.quoteStudio?.step === 'canvas');
    const targetObj = isStudio ? Store.state.quoteStudio?.currentWindow : Store.state.rateCalc?.grid;
    if (!targetObj) return;
    if (paneIndex === undefined || paneIndex === null || paneIndex < 0) {
        paneIndex = targetObj.activePaneIndex !== undefined ? targetObj.activePaneIndex : 0;
    }
    if (typeof window.snapshotCurrentCalc === 'function') window.snapshotCurrentCalc();
    if (targetObj.panePartitions) targetObj.panePartitions[paneIndex] = 0;
    if (targetObj.partitionPos) targetObj.partitionPos[paneIndex] = 'top';
    if (targetObj.partitionDir) targetObj.partitionDir[paneIndex] = 'horizontal';
    if (targetObj.partitionHeights) delete targetObj.partitionHeights[paneIndex];
    if (targetObj.subPartitions) {
        delete targetObj.subPartitions[`${paneIndex}_0`];
        delete targetObj.subPartitions[`${paneIndex}_1`];
    }
    window.showStudioToast(`Partition removed from Pane ${paneIndex + 1}`);
    Store.notify();
};

window.resetCurrentCalcWindow = () => {
    const isStudio = Store.state.calcTab === 'quotes' || (Store.state.calcTab === 'quotation' && Store.state.quoteStudio?.step === 'canvas');
    if (isStudio && Store.state.quoteStudio?.currentWindow) {
        const cw = Store.state.quoteStudio.currentWindow;
        cw.panePartitions = Array(cw.cols).fill(0);
        cw.partitionPos = Array(cw.cols).fill('top');
        cw.partitionDir = Array(cw.cols).fill('horizontal');
        cw.partitionHeights = {};
        cw.subPartitions = {};
        cw.subOrientations = {};
        cw.subTubeCounts = {};
        const defaultPaneW = parseFloat((cw.totalW / cw.cols).toFixed(1));
        cw.paneWidths = Array(cw.cols).fill(defaultPaneW);
        window.showStudioToast('Studio window reset to clean default');
        Store.notify();
        return;
    }
    if (Store.state.rateCalc?.grid) {
        const g = Store.state.rateCalc.grid;
        if (typeof window.snapshotCurrentCalc === 'function') window.snapshotCurrentCalc();
        g.panePartitions = Array(g.cols).fill(0);
        g.partitionPos = Array(g.cols).fill('top');
        g.partitionDir = Array(g.cols).fill('horizontal');
        g.partitionHeights = {};
        g.subPartitions = {};
        g.subOrientations = {};
        g.subTubeCounts = {};
        const defaultPaneW = parseFloat((g.totalW / g.cols).toFixed(1));
        g.paneWidths = Array(g.cols).fill(defaultPaneW);
        window.showStudioToast('Window reset to clean default');
        Store.notify();
    }
};

window.updatePartitionPanelHeight = (paneIndex, newHeight) => {
    const isStudio = Store.state.calcTab === 'quotes' || (Store.state.calcTab === 'quotation' && Store.state.quoteStudio?.step === 'canvas');
    const targetObj = isStudio ? Store.state.quoteStudio?.currentWindow : Store.state.rateCalc?.grid;
    if (!targetObj) return;
    if (typeof window.snapshotCurrentCalc === 'function') window.snapshotCurrentCalc();
    
    const hVal = parseFloat(newHeight) || 0;
    const totH = parseFloat(targetObj.totalH) || 140;
    if (hVal > 0 && hVal < totH) {
        if (!targetObj.partitionHeights) targetObj.partitionHeights = {};
        targetObj.partitionHeights[paneIndex] = hVal;
        if (!targetObj.panePartitions) targetObj.panePartitions = Array(targetObj.cols).fill(0);
        targetObj.panePartitions[paneIndex] = Math.max(1, targetObj.panePartitions[paneIndex] || 1);
        if (!targetObj.partitionDir) targetObj.partitionDir = Array(targetObj.cols).fill('horizontal');
        targetObj.partitionDir[paneIndex] = 'horizontal';
        
        const frac = hVal / totH;
        if (!targetObj.partitionPos) targetObj.partitionPos = Array(targetObj.cols).fill('top');
        if (frac <= 0.30) targetObj.partitionPos[paneIndex] = 'quarter';
        else if (frac <= 0.42) targetObj.partitionPos[paneIndex] = 'top';
        else if (frac <= 0.58) targetObj.partitionPos[paneIndex] = 'center';
        else if (frac <= 0.70) targetObj.partitionPos[paneIndex] = 'bottom';
        else targetObj.partitionPos[paneIndex] = 'threequarter';
        
        window.showStudioToast(`Pane ${paneIndex + 1} panel height set to ${hVal} ${targetObj.unit || 'cm'}`);
        Store.notify();
    }
};

window.toggleSubGrillOrientation = (paneIndex, subIndex = 0) => {
    const isStudio = Store.state.calcTab === 'quotation' && Store.state.quoteStudio?.step === 'editor';
    const targetObj = isStudio ? Store.state.quoteStudio?.currentWindow : Store.state.rateCalc?.grid;
    if (!targetObj) return;
    if (!targetObj.subOrientations) targetObj.subOrientations = {};
    const key = `${paneIndex}_${subIndex}`;
    const cur = targetObj.subOrientations[key] || (targetObj.paneTubeOrientations && targetObj.paneTubeOrientations[paneIndex]) || 'horizontal';
    const next = cur === 'horizontal' ? 'vertical' : 'horizontal';
    targetObj.subOrientations[key] = next;
    Store.notify();
    const isVert = (targetObj.panePartitions?.[paneIndex] || 0) > 0 && targetObj.partitionDir?.[paneIndex] === 'vertical';
    const subLabel = (targetObj.panePartitions?.[paneIndex] || 0) > 0 
        ? (isVert ? (subIndex === 0 ? 'Left Opening' : 'Right Opening') : (subIndex === 0 ? 'Top Opening' : 'Main Opening')) 
        : '';
    window.showStudioToast(`Pane ${paneIndex + 1} ${subLabel} grill rotated to ${next.toUpperCase()}`);
};

window.promptSubPipeCount = (paneIndex, subIndex = 0) => {
    const isStudio = Store.state.calcTab === 'quotation' && Store.state.quoteStudio?.step === 'editor';
    const targetObj = isStudio ? Store.state.quoteStudio?.currentWindow : Store.state.rateCalc?.grid;
    if (!targetObj) return;
    if (!targetObj.subTubeCounts) targetObj.subTubeCounts = {};
    const key = `${paneIndex}_${subIndex}`;
    const cur = targetObj.subTubeCounts[key] ?? '';
    const subLabel = (targetObj.panePartitions?.[paneIndex] || 0) > 0 ? (subIndex === 0 ? 'Top Opening' : 'Main Opening') : '';
    const ans = prompt(`Enter number of pipes for Pane ${paneIndex + 1} ${subLabel}:`, cur === null ? '6' : String(cur));
    if (ans !== null && !isNaN(parseInt(ans))) {
        if (typeof window.snapshotCurrentCalc === 'function') window.snapshotCurrentCalc();
        targetObj.subTubeCounts[key] = Math.max(0, parseInt(ans));
        Store.notify();
        window.showStudioToast(`Pane ${paneIndex + 1} ${subLabel} set to ${targetObj.subTubeCounts[key]} pipes`);
    }
};

function renderManualCalc(state) {
    try {
        const defUnit = Store.state.settings?.preferences?.unit || 'cm';
        
        // 1. Initialize State: STRICTLY 1 KALLI (Single Pane) with 50 x 140 cm default
        if (!state.rateCalc || !state.rateCalc.grid) {
            state.rateCalc = {
                category: 'Window',
                materials: {
                    frame: 'prof_box',
                    pipe: 'tube_sq_1x1',
                    panel: 'glass_5mm_clear',
                    hinge: 'hinge_ss_4in',
                    paint: 'paint_epoxy_black',
                    hook: 'hook_stay_8in',
                    lock: 'lock_cockspur'
                },
                grid: {
                    cols: 1, // ALWAYS START ON 1 KALLI (ഒറ്റക്കള്ളി)
                    rows: 1,
                    totalW: convertUnit(50, 'cm', defUnit),
                    totalH: convertUnit(140, 'cm', defUnit),
                    unit: defUnit,
                    paneWidths: [convertUnit(50, 'cm', defUnit)],
                    panePartitions: [0],
                    partitionPos: ['top']
                },
                params: {
                    laborCharge: 800,
                    profitMarginPercent: 15
                }
            };
        }

        const rc = state.rateCalc;
        if (!rc.materials) rc.materials = {};
        if (rc.materials.frame === undefined) rc.materials.frame = 'prof_box';
        if (rc.materials.pipe === undefined || rc.materials.pipe === 'tube_sq_1x1') rc.materials.pipe = 'tube_sq_20x20';
        if (rc.materials.panel === undefined) rc.materials.panel = 'glass_5mm_clear';
        if (rc.materials.hinge === undefined) rc.materials.hinge = 'hinge_ss_4in';
        if (rc.materials.paint === undefined) rc.materials.paint = 'paint_epoxy_black';
        if (rc.materials.hook === undefined) rc.materials.hook = 'hook_stay_8in';
        if (rc.materials.lock === undefined) rc.materials.lock = 'lock_cockspur';

        if (!rc.grid) rc.grid = {};
        if (!rc.grid.cols) rc.grid.cols = 1;
        if (!rc.grid.unit) rc.grid.unit = defUnit;
        if (!rc.grid.totalW) rc.grid.totalW = convertUnit(rc.grid.cols * 50, 'cm', rc.grid.unit);
        if (!rc.grid.totalH) rc.grid.totalH = convertUnit(140, 'cm', rc.grid.unit);

        if (!rc.params) rc.params = {};
        if (rc.params.frameWeightPerFt === undefined) rc.params.frameWeightPerFt = 1.15;
        if (rc.params.frameRatePerKg === undefined) rc.params.frameRatePerKg = 85;
        if (rc.params.hingeCost === undefined) rc.params.hingeCost = 75;
        if (rc.params.laborCharge === undefined) rc.params.laborCharge = 800;
        if (rc.params.panelRate === undefined) rc.params.panelRate = 65;
        if (rc.params.partitionRate === undefined) rc.params.partitionRate = 350;
        if (rc.params.profitMarginPercent === undefined) rc.params.profitMarginPercent = 15;

        const g = rc.grid;
        const p = rc.params;
        if (g.activePaneIndex === undefined || g.activePaneIndex >= g.cols || g.activePaneIndex < 0) {
            g.activePaneIndex = 0;
        }
        const catalog = Store.state.materialCatalog || [];
        const currency = Store.state.settings?.preferences?.currency || '₹';

        // History tracking & Dual Keyboard Shortcuts
        window.calcHistory = window.calcHistory || { past: [], future: [], isRestoring: false };
        window.calcShortcutBuffer = window.calcShortcutBuffer || { key: null, timer: null };

        if (!window.calcHistoryBound) {
            window.addEventListener('keydown', (e) => {
                if (Store.state.currentView !== 'calculation') return;

                // Handle Ctrl+Z and Ctrl+X for undo/redo
                if (e.ctrlKey && e.key.toLowerCase() === 'z') { e.preventDefault(); window.handleUndo(); return; }
                if (e.ctrlKey && e.key.toLowerCase() === 'x') { e.preventDefault(); window.handleRedo(); return; }

                // Ignore if user is currently typing inside an input, textarea, or select
                const activeTag = document.activeElement ? document.activeElement.tagName.toUpperCase() : '';
                if (activeTag === 'INPUT' || activeTag === 'TEXTAREA' || activeTag === 'SELECT') {
                    return;
                }

                // Ignore modifier keys
                if (e.ctrlKey || e.altKey || e.metaKey) return;

                const key = e.key.toLowerCase();
                const isStudio = Store.state.calcTab === 'quotation' && Store.state.quoteStudio?.step === 'editor';
                const targetObj = isStudio ? Store.state.quoteStudio?.currentWindow : Store.state.rateCalc?.grid;
                if (!targetObj) return;

                const cols = targetObj.cols || 1;
                let activeIdx = targetObj.activePaneIndex !== undefined ? targetObj.activePaneIndex : 0;
                if (activeIdx >= cols) activeIdx = 0;

                // Handle Escape to disarm command or close popovers
                if (key === 'escape') {
                    if (window.calcArmedCommand) {
                        e.preventDefault();
                        window.disarmCalcCommand();
                        return;
                    }
                    if (typeof window.closePartitionPosDropdown === 'function') {
                        window.closePartitionPosDropdown();
                    }
                    return;
                }

                // Append to sequence buffer (Audios 1, 3, 4, 6: PT, PM, PB, R, PN, PPN, NP)
                window.calcShortcutSequence = (window.calcShortcutSequence || '') + key;
                clearTimeout(window.calcShortcutTimer);
                window.calcShortcutTimer = setTimeout(() => {
                    window.calcShortcutSequence = '';
                }, 1800);

                const seq = window.calcShortcutSequence;

                // PT: Partition Top (Arms command, then click pane to apply)
                if (seq.endsWith('pt')) {
                    e.preventDefault();
                    window.armCalcCommand('PARTITION_TOP', 'PT', 'Top Partition', 'Click any pane to apply Top Partition');
                    return;
                }

                // PM: Partition Middle (Arms command, then click pane to apply)
                if (seq.endsWith('pm')) {
                    e.preventDefault();
                    window.armCalcCommand('PARTITION_MIDDLE', 'PM', 'Middle Partition', 'Click any pane to apply Middle Partition');
                    return;
                }

                // PB: Partition Bottom (Arms command, then click pane to apply)
                if (seq.endsWith('pb')) {
                    e.preventDefault();
                    window.armCalcCommand('PARTITION_BOTTOM', 'PB', 'Bottom Partition', 'Click any pane to apply Bottom Partition');
                    return;
                }

                // PV: Partition Vertical (Audio 2: arms command, then click pane to apply)
                if (seq.endsWith('pv')) {
                    e.preventDefault();
                    window.armCalcCommand('PARTITION_VERTICAL', 'PV', 'Vertical Partition', 'Click any pane to apply Vertical Partition');
                    return;
                }

                // PV: Partition Vertical (Audio 2: arms command, then click pane to apply)
                if (seq.endsWith('pv')) {
                    e.preventDefault();
                    window.armCalcCommand('PARTITION_VERTICAL', 'PV', 'Vertical Partition', 'Click any pane to apply Vertical Partition');
                    return;
                }

                // PV: Partition Vertical (Audio 2: arms command, then click pane to apply)
                if (seq.endsWith('pv')) {
                    e.preventDefault();
                    window.armCalcCommand('PARTITION_VERTICAL', 'PV', 'Vertical Partition', 'Click any pane to apply Vertical Partition');
                    return;
                }

                // PK: Partition Quarter (25%)
                if (seq.endsWith('pk')) {
                    e.preventDefault();
                    window.armCalcCommand('PARTITION_QUARTER', 'PK', 'Quarter Partition (25%)', 'Click any pane to apply Quarter Partition');
                    return;
                }

                // PR / RM: Partition Remove (Audio: Remove partition from active pane or arm remove)
                if (seq.endsWith('pr') || seq.endsWith('rm')) {
                    e.preventDefault();
                    window.calcShortcutSequence = '';
                    if (targetObj.activePaneIndex !== undefined && (targetObj.panePartitions?.[targetObj.activePaneIndex] || 0) > 0) {
                        window.removePanePartition(targetObj.activePaneIndex);
                        return;
                    }
                    window.armCalcCommand('REMOVE_PARTITION', 'PR', 'Remove Partition', 'Click any pane to remove its partition');
                    return;
                }

                // PPN: Per-Pane Pipe Number (Arms command, then click pane to input pipe count)
                if (seq.endsWith('ppn')) {
                    e.preventDefault();
                    window.armCalcCommand('SET_PANE_PIPES', 'PPN', 'Set Pane Pipe Count', 'Click a pane to enter pipe count');
                    return;
                }

                // PN: Global Pipe Number across window (Prompts immediately)
                if (seq.endsWith('pn')) {
                    e.preventDefault();
                    window.calcShortcutSequence = '';
                    window.promptGlobalPipeCount();
                    return;
                }

                // NP: Remove Pipes from pane (Arms command, then click pane to remove pipes)
                if (seq.endsWith('np')) {
                    e.preventDefault();
                    window.armCalcCommand('REMOVE_PIPES', 'NP', 'Remove Pipes', 'Click a pane to remove all pipes');
                    return;
                }

                // R: Rotate grill pipes orientation in pane or sub-section
                if (key === 'r') {
                    e.preventDefault();
                    if (targetObj.activePaneIndex !== undefined && targetObj.activeSubIndex !== undefined) {
                        window.toggleSubGrillOrientation(targetObj.activePaneIndex, targetObj.activeSubIndex);
                        return;
                    }
                    window.armCalcCommand('ROTATE_GRILL', 'R', 'Rotate Grill Pipes', 'Click any opening to rotate pipes (Horizontal ⮂ Vertical)');
                    return;
                }

                // Number keys 1-9 to quickly select active pane
                if (['1','2','3','4','5','6','7','8','9'].includes(key)) {
                    const pNum = parseInt(key) - 1;
                    if (pNum < cols) {
                        e.preventDefault();
                        targetObj.activePaneIndex = pNum;
                        Store.notify();
                    }
                }
            });
            window.calcHistoryBound = true;
        }

        function snapshotCalc() {
            if (window.calcHistory.isRestoring) return;
            const currentRc = Store.state.rateCalc;
            if (!currentRc) return;
            window.calcHistory.past.push(JSON.stringify(currentRc));
            if (window.calcHistory.past.length > 30) window.calcHistory.past.shift();
            window.calcHistory.future = [];
        }
        window.snapshotCurrentCalc = snapshotCalc;

        window.handleUndo = () => {
            if (window.calcHistory.past.length === 0) return;
            const currentRc = Store.state.rateCalc;
            if (currentRc) window.calcHistory.future.push(JSON.stringify(currentRc));
            const prev = window.calcHistory.past.pop();
            window.calcHistory.isRestoring = true;
            Store.state.rateCalc = JSON.parse(prev);
            Store.notify();
            setTimeout(() => { window.calcHistory.isRestoring = false; }, 50);
        };

        window.handleRedo = () => {
            if (window.calcHistory.future.length === 0) return;
            const currentRc = Store.state.rateCalc;
            if (currentRc) window.calcHistory.future.push(JSON.stringify(currentRc));
            const next = window.calcHistory.future.pop();
            window.calcHistory.isRestoring = true;
            Store.state.rateCalc = JSON.parse(next);
            Store.notify();
            setTimeout(() => { window.calcHistory.isRestoring = false; }, 50);
        };

        // Reset to Defaults: Strictly 1 Kalli 50 x 140 cm
        window.resetQuickCalcDefaults = () => {
            snapshotCalc();
            const u = g.unit || 'cm';
            Store.state.rateCalc = {
                category: 'Window',
                materials: {
                    frame: 'prof_box',
                    pipe: 'tube_sq_1x1',
                    panel: 'glass_5mm_clear',
                    hinge: 'hinge_ss_4in',
                    paint: 'paint_epoxy_black',
                    hook: 'hook_stay_8in',
                    lock: 'lock_cockspur'
                },
                grid: {
                    cols: 1, // Reset to 1 Kalli
                    rows: 1,
                    totalW: convertUnit(50, 'cm', u),
                    totalH: convertUnit(140, 'cm', u),
                    unit: u,
                    paneWidths: [convertUnit(50, 'cm', u)],
                    panePartitions: [0],
                    partitionPos: ['top']
                },
                params: {
                    frameWeightPerFt: 1.15,
                    frameRatePerKg: 85,
                    hingeCost: 75,
                    laborCharge: 800,
                    panelRate: 65,
                    partitionRate: 350,
                    profitMarginPercent: 15
                }
            };
            window.calcSearchQuery = '';
            window.calcMaterialSearchQuery = '';
            Store.notify();
        };

        // Pane Arrays Management
        if (!g.paneWidths || g.paneWidths.length !== g.cols) {
            const equalW = parseFloat((g.totalW / g.cols).toFixed(1));
            g.paneWidths = Array(g.cols).fill(equalW);
        }
        if (!g.panePartitions || g.panePartitions.length !== g.cols) {
            g.panePartitions = Array(g.cols).fill(0);
        }
        if (!g.partitionPos || g.partitionPos.length !== g.cols) {
            g.partitionPos = Array(g.cols).fill('top');
        }
        if (!g.partitionDir || g.partitionDir.length !== g.cols) {
            g.partitionDir = Array(g.cols).fill('horizontal');
        }
        if (!g.partitionDir || g.partitionDir.length !== g.cols) {
            g.partitionDir = Array(g.cols).fill('horizontal');
        }
        if (!g.partitionDir || g.partitionDir.length !== g.cols) {
            g.partitionDir = Array(g.cols).fill('horizontal');
        }

        // Units & Dimensions Normalization
        const w_mm = convertUnit(g.totalW, g.unit, 'mm');
        const h_mm = convertUnit(g.totalH, g.unit, 'mm');
        const w_ft = (w_mm / 25.4) / 12;
        const h_ft = (h_mm / 25.4) / 12;
        const areaSqFt = Math.max(0.01, w_ft * h_ft);
        const outerPerimeterFt = 2 * (w_ft + h_ft);

        // Material Lookups from Material Catalog with '-- None (Not Included) --' support
        const getCatItem = (catKey, defaultId) => {
            const selId = rc.materials?.[catKey];
            if (selId === 'none' || selId === '' || selId === false) {
                return { id: 'none', name: 'None (Not Included)', rate: 0, weightFactor: 0, isNone: true };
            }
            const found = catalog.find(m => m.id === selId || m.name === selId);
            if (found) return found;
            return catalog.find(m => (m.category || '').toLowerCase() === catKey.toLowerCase()) ||
                   { id: defaultId, name: 'Standard ' + catKey, rate: 0, weightFactor: 0 };
        };

        const frameItem = getCatItem('frame', 'prof_box');
        const pipeItem = getCatItem('pipe', 'tube_sq_1x1');
        const panelItem = getCatItem('panel', 'glass_5mm_clear');
        const hingeItem = getCatItem('hinge', 'hinge_ss_4in');
        const paintItem = getCatItem('paint', 'paint_epoxy_black');
        const hookItem = getCatItem('hook', 'hook_stay_8in');
        const lockItem = getCatItem('lock', 'lock_cockspur');

        // Pipe & Security Grill Tubes Calculation Setup
        // Ensure arrays for orientations and custom counts
        if (!g.paneTubeOrientations) g.paneTubeOrientations = Array(g.cols).fill('horizontal');
        if (!g.paneTubeCounts) g.paneTubeCounts = Array(g.cols).fill(null);

        let partitionLenFt = 0;
        let totalPartitionDividers = 0;
        let totalGrillPipes = 0;
        let totalGrillLengthCm = 0;

        const totWCm = Math.round(convertUnit(g.totalW, g.unit, 'cm'));
        const totHCm = Math.round(convertUnit(g.totalH, g.unit, 'cm'));
        const totalInnerWCm = convertUnit(g.totalW, g.unit, 'cm') - (g.cols > 1 ? (g.cols - 1) * 2.5 : 0);
        const totalInnerHCm = convertUnit(g.totalH, g.unit, 'cm') - 8;

        for (let i = 0; i < g.cols; i++) {
            const parts = g.panePartitions[i] || 0;
            const isVert = parts > 0 && ((g.partitionDir && g.partitionDir[i] === 'vertical') || (g.partitionPos && g.partitionPos[i] === 'vertical'));
            if (parts > 0) {
                totalPartitionDividers += parts;
                if (isVert) {
                    partitionLenFt += parts * h_ft;
                } else {
                    const pw_mm = convertUnit(g.paneWidths[i], g.unit, 'mm');
                    partitionLenFt += parts * ((pw_mm / 25.4) / 12);
                }
            }

            // Calculate grill tubes for this pane
            const paneW_cm = convertUnit(g.paneWidths[i] || (g.totalW / g.cols), g.unit, 'cm');

            if (parts === 0) {
                const orient0 = (g.subOrientations && g.subOrientations[`${i}_0`]) || (g.paneTubeOrientations && g.paneTubeOrientations[i]) || 'horizontal';
                const count0 = (g.subTubeCounts && g.subTubeCounts[`${i}_0`]) ?? (g.paneTubeCounts ? g.paneTubeCounts[i] : null);
                const gr = computePaneGrill(paneW_cm, totalInnerHCm, orient0, count0);
                totalGrillPipes += gr.count;
                totalGrillLengthCm += gr.totalLengthCm;
            } else if (isVert) {
                const w1_cm = Math.max(5, (paneW_cm - 2.5) * 0.5);
                const w2_cm = Math.max(5, paneW_cm - 2.5 - w1_cm);
                const orient0 = (g.subOrientations && g.subOrientations[`${i}_0`]) || (g.paneTubeOrientations && g.paneTubeOrientations[i]) || 'horizontal';
                const orient1 = (g.subOrientations && g.subOrientations[`${i}_1`]) || (g.paneTubeOrientations && g.paneTubeOrientations[i]) || 'horizontal';
                const count0 = (g.subTubeCounts && g.subTubeCounts[`${i}_0`]) ?? (g.paneTubeCounts ? Math.round(g.paneTubeCounts[i] * 0.5) : null);
                const count1 = (g.subTubeCounts && g.subTubeCounts[`${i}_1`]) ?? (g.paneTubeCounts ? Math.round(g.paneTubeCounts[i] * 0.5) : null);
                const gr1 = computePaneGrill(w1_cm, totalInnerHCm, orient0, count0);
                const gr2 = computePaneGrill(w2_cm, totalInnerHCm, orient1, count1);
                totalGrillPipes += gr1.count + gr2.count;
                totalGrillLengthCm += gr1.totalLengthCm + gr2.totalLengthCm;
            } else if (parts === 1) {
                const pos = (g.partitionPos && g.partitionPos[i]) || 'top';
                let pyFrac = 0.35;
                if (g.partitionHeights && g.partitionHeights[i]) {
                    pyFrac = Math.max(0.1, Math.min(0.9, g.partitionHeights[i] / Math.max(10, totHCm)));
                } else if (pos === 'quarter') {
                    pyFrac = 0.25;
                } else if (pos === 'center') {
                    pyFrac = 0.50;
                } else if (pos === 'bottom') {
                    pyFrac = 0.65;
                } else if (pos === 'threequarter') {
                    pyFrac = 0.75;
                }
                const h1_cm = totalInnerHCm * pyFrac;
                const h2_cm = totalInnerHCm * (1 - pyFrac);
                const orient0 = (g.subOrientations && g.subOrientations[`${i}_0`]) || (g.paneTubeOrientations && g.paneTubeOrientations[i]) || 'horizontal';
                const orient1 = (g.subOrientations && g.subOrientations[`${i}_1`]) || (g.paneTubeOrientations && g.paneTubeOrientations[i]) || 'horizontal';
                const count0 = (g.subTubeCounts && g.subTubeCounts[`${i}_0`]) ?? (g.paneTubeCounts ? Math.round(g.paneTubeCounts[i] * pyFrac) : null);
                const count1 = (g.subTubeCounts && g.subTubeCounts[`${i}_1`]) ?? (g.paneTubeCounts ? Math.round(g.paneTubeCounts[i] * (1 - pyFrac)) : null);
                const gr1 = computePaneGrill(paneW_cm, h1_cm, orient0, count0);
                const gr2 = computePaneGrill(paneW_cm, h2_cm, orient1, count1);
                totalGrillPipes += gr1.count + gr2.count;
                totalGrillLengthCm += gr1.totalLengthCm + gr2.totalLengthCm;
            } else {
                const hEach = totalInnerHCm / (parts + 1);
                for (let p = 0; p <= parts; p++) {
                    const orientP = (g.subOrientations && g.subOrientations[`${i}_${p}`]) || (g.paneTubeOrientations && g.paneTubeOrientations[i]) || 'horizontal';
                    const countP = (g.subTubeCounts && g.subTubeCounts[`${i}_${p}`]) ?? (g.paneTubeCounts ? Math.round(g.paneTubeCounts[i] / (parts + 1)) : null);
                    const gr = computePaneGrill(paneW_cm, hEach, orientP, countP);
                    totalGrillPipes += gr.count;
                    totalGrillLengthCm += gr.totalLengthCm;
                }
            }
        }

        // Dynamic Window Fabrication Costing & Engineering Calculation Engine
        // Strictly adheres to benchmark formulas and rates from window calcu-formula.md
        const totalPartitions = (g.panePartitions && Array.isArray(g.panePartitions))
            ? g.panePartitions.reduce((sum, p) => sum + (parseInt(p) || 0), 0)
            : 0;

        const fabCalc = calculateWindowFabrication({
            width: g.totalW,
            height: g.totalH,
            unit: g.unit,
            bays: g.cols,
            partitions: totalPartitions,
            panePartitions: g.panePartitions,
            shuttersCount: g.cols,
            panelRate: (panelItem && !panelItem.isNone) ? (panelItem.rate || 0) : 0,
            profitMarginPercent: p.profitMarginPercent !== undefined ? p.profitMarginPercent : 15
        });

        // Frame Section & Material Breakdown Calculation Variables (Dynamic Engineering Formulas)
        if (p.laborCharge === undefined) p.laborCharge = 800;
        if (p.profitMarginPercent === undefined) p.profitMarginPercent = 15;

        // Material 1: Frame / Profile
        const frameLenFt = frameItem.isNone ? 0 : outerPerimeterFt;
        const frameWeightKg = frameItem.isNone ? 0 : (frameLenFt * (frameItem.weightFactor || 1.45));
        const frameSubtotal = frameItem.isNone ? 0 : (frameWeightKg * (frameItem.rate || 180));

        // Material 2: Pipe (Mullions & Partitions)
        partitionLenFt = 0;
        totalPartitionDividers = 0;
        if (!pipeItem.isNone) {
            for (let i = 0; i < g.cols; i++) {
                const parts = g.panePartitions?.[i] || 0;
                if (parts > 0) {
                    totalPartitionDividers += parts;
                    const pw_mm = convertUnit(g.paneWidths?.[i] || (g.totalW / g.cols), g.unit, 'mm');
                    partitionLenFt += parts * ((pw_mm / 25.4) / 12);
                }
            }
        }
        const pipeLenFt = pipeItem.isNone ? 0 : (((g.cols - 1) * h_ft) + partitionLenFt);
        const pipeWeightKg = pipeItem.isNone ? 0 : (pipeLenFt * (pipeItem.weightFactor || 1.15));
        const pipeSubtotal = pipeItem.isNone ? 0 : (pipeWeightKg * (pipeItem.rate || 95));

        // Material 3: Panel
        const panelAreaSqFt = panelItem.isNone ? 0 : areaSqFt;
        const panelWeightKg = panelItem.isNone ? 0 : (panelAreaSqFt * (panelItem.weightFactor || 1.15));
        const panelSubtotal = panelItem.isNone ? 0 : (panelAreaSqFt * (panelItem.rate || 55));

        // Material 4: Hinges
        const hingeQty = hingeItem.isNone ? 0 : Math.max(2, g.cols * 2);
        const hingeWeightKg = hingeItem.isNone ? 0 : (hingeQty * (hingeItem.weightFactor || 0.18));
        const hingeSubtotal = hingeItem.isNone ? 0 : (hingeQty * (hingeItem.rate || 85));

        // Material 5: Paint
        const surfaceAreaFt2 = paintItem.isNone ? 0 : ((frameLenFt + pipeLenFt) * 0.45);
        const paintLtr = paintItem.isNone ? 0 : Math.max(0.5, parseFloat((surfaceAreaFt2 / (paintItem.coverage || 12)).toFixed(2)));
        const paintSubtotal = paintItem.isNone ? 0 : (paintLtr * (paintItem.rate || 480));

        // Material 6: Hook & Rubber
        const hookQty = hookItem.isNone ? 0 : Math.max(1, Math.min(g.cols, 2));
        const hookWeightKg = hookItem.isNone ? 0 : (hookQty * (hookItem.weightFactor || 0.20));
        const hookSubtotal = hookItem.isNone ? 0 : (hookQty * (hookItem.rate || 75));

        // Material 7: Lock & Accessories
        const lockQty = lockItem.isNone ? 0 : Math.max(1, Math.min(g.cols, 2));
        const lockWeightKg = lockItem.isNone ? 0 : (lockQty * (lockItem.weightFactor || 0.25));
        const lockSubtotal = lockItem.isNone ? 0 : (lockQty * (lockItem.rate || 160));

        const totalMaterialCost = frameSubtotal + pipeSubtotal + panelSubtotal + hingeSubtotal + paintSubtotal + hookSubtotal + lockSubtotal;
        const laborCharges = parseFloat(p.laborCharge ?? 800) || 0;
        const profitMarginPercent = parseFloat(p.profitMarginPercent ?? 15) || 0;
        const baseCost = totalMaterialCost + laborCharges;
        const addedProfit = baseCost * (profitMarginPercent / 100);
        const grandTotal = baseCost + addedProfit;
        window.currentComputeTotal = grandTotal;

        // Grid & Parameter Updates
        window.updateGrid = (key, val) => {
            snapshotCalc();
            if (key.startsWith('mat_')) {
                const matType = key.split('_')[1];
                rc.materials[matType] = val;
            } else if (key === 'unit') {
                window.toggleUnit(val);
                return;
            } else if (key === 'cols') {
                const newCols = Math.max(1, parseInt(val) || 1);
                g.cols = newCols;
                const defaultPaneW = parseFloat((g.totalW / newCols).toFixed(1));
                g.paneWidths = Array(newCols).fill(defaultPaneW);
                g.panePartitions = Array(newCols).fill(0);
                g.partitionPos = Array(newCols).fill('top');
            } else if (key === 'totalW') {
                const newTotal = parseFloat(val) || 0;
                const oldTotal = g.totalW || 1;
                g.totalW = newTotal;
                if (g.paneWidths && g.paneWidths.length === g.cols && oldTotal > 0) {
                    g.paneWidths = g.paneWidths.map(pw => parseFloat(((pw / oldTotal) * newTotal).toFixed(1)));
                }
            } else if (key === 'totalH') {
                g.totalH = parseFloat(val) || 0;
            } else if (key === 'frameWeightPerFt') {
                p.frameWeightPerFt = parseFloat(val) || 0;
            } else if (key === 'frameRatePerKg') {
                p.frameRatePerKg = parseFloat(val) || 0;
            } else if (key === 'hingeCost' || key === 'hingeRate') {
                p.hingeCost = parseFloat(val) || 0;
            } else if (key === 'laborCharge') {
                p.laborCharge = parseFloat(val) || 0;
            } else if (key === 'panelRate') {
                p.panelRate = parseFloat(val) || 0;
            } else if (key === 'profitMarginPercent') {
                p.profitMarginPercent = parseFloat(val) || 0;
            }
            Store.notify();
        };

        window.saveCostSheetToCustomer = () => {
            window.saveCalcRecord();
        };

        window.saveAndNewCostSheet = () => {
            window.saveCalcRecord();
            window.resetQuickCalcDefaults();
        };

        // Kalli Preset Selection: Each Kalli adds 50 cm width! Normal default height is 140 cm.
        window.loadPreset = (cols) => {
            snapshotCalc();
            const newCols = Math.max(1, parseInt(cols) || 1);
            g.cols = newCols;
            const widthCm = newCols * 50;
            g.totalW = convertUnit(widthCm, 'cm', g.unit);
            g.totalH = convertUnit(140, 'cm', g.unit);
            const paneWInUnit = convertUnit(50, 'cm', g.unit);
            g.paneWidths = Array(newCols).fill(paneWInUnit);
            g.panePartitions = Array(newCols).fill(0);
            g.partitionPos = Array(newCols).fill('top');
            Store.notify();
        };

        window.selectPane = (index, toggleIfActive = false) => {
            if (index >= 0 && index < g.cols) {
                if (toggleIfActive && g.activePaneIndex === index) {
                    window.cyclePanePartition(index);
                } else {
                    g.activePaneIndex = index;
                    Store.notify();
                }
            }
        };

        window.setPanePartitionCount = (index, count) => {
            snapshotCalc();
            const isStudio = Store.state.calcTab === 'quotation' && Store.state.quoteStudio?.step === 'editor';
            const target = isStudio ? Store.state.quoteStudio?.currentWindow : g;
            if (!target) return;
            if (!target.panePartitions) target.panePartitions = Array(target.cols).fill(0);
            target.activePaneIndex = index;
            target.panePartitions[index] = Math.max(0, Math.min(10, parseInt(count) || 0));
            Store.notify();
        };

        window.setPanePartitionPos = (index, pos, dir = null, count = null) => {
            snapshotCalc();
            const isStudio = Store.state.calcTab === 'quotation' && Store.state.quoteStudio?.step === 'editor';
            const target = isStudio ? Store.state.quoteStudio?.currentWindow : g;
            if (!target) return;
            if (count === 0 || pos === 'clear') {
                window.removePanePartition(index);
                return;
            }
            if (!target.partitionPos) target.partitionPos = Array(target.cols).fill('top');
            if (!target.partitionDir) target.partitionDir = Array(target.cols).fill('horizontal');
            if (!target.panePartitions) target.panePartitions = Array(target.cols).fill(0);
            target.activePaneIndex = index;
            if (count !== null && count !== undefined) {
                target.panePartitions[index] = Math.max(0, Math.min(10, parseInt(count) || 0));
            } else if ((target.panePartitions[index] || 0) === 0) {
                target.panePartitions[index] = 1;
            }
            if (target.partitionHeights) delete target.partitionHeights[index];
            if (dir) target.partitionDir[index] = dir;
            else if (pos === 'vertical') {
                target.partitionDir[index] = 'vertical';
                pos = 'center';
            }
            target.partitionPos[index] = pos;
            Store.notify();
        };

        window.cyclePanePartition = (index) => {
            snapshotCalc();
            if (!g.panePartitions) g.panePartitions = Array(g.cols).fill(0);
            g.activePaneIndex = index;
            const cur = g.panePartitions[index] || 0;
            g.panePartitions[index] = (cur + 1) % 6; // cycles 0 -> 1 -> 2 -> 3 -> 4 -> 5 -> 0
            Store.notify();
        };

        // Partition Position Toggle (Top -> Center -> Bottom -> Top)
        window.cyclePanePartitionPos = (index) => {
            snapshotCalc();
            if (!g.partitionPos) g.partitionPos = Array(g.cols).fill('top');
            g.activePaneIndex = index;
            const cur = g.partitionPos[index] || 'top';
            const next = cur === 'top' ? 'center' : (cur === 'center' ? 'bottom' : 'top');
            g.partitionPos[index] = next;
            Store.notify();
        };

        // Measurement Unit Conversion: Accurate bidirectional conversion across cm, mm, inch, ft, m
        window.toggleUnit = (newUnit) => {
            if (newUnit === g.unit) return;
            snapshotCalc();
            const oldUnit = g.unit;
            g.totalW = convertUnit(g.totalW, oldUnit, newUnit);
            g.totalH = convertUnit(g.totalH, oldUnit, newUnit);
            if (g.paneWidths && g.paneWidths.length) {
                g.paneWidths = g.paneWidths.map(w => convertUnit(w, oldUnit, newUnit));
            }
            g.unit = newUnit;
            Store.notify();
        };

        window.updateIndividualPaneWidth = (index, val) => {
            snapshotCalc();
            let newVal = parseFloat(val) || 0;
            if (newVal <= 0) newVal = 10;
            g.paneWidths[index] = newVal;
            // Independent Pane Widths (Audio 2): All column widths add up without resetting other panes
            g.totalW = parseFloat(g.paneWidths.reduce((sum, w) => sum + (parseFloat(w) || 0), 0).toFixed(1));
            Store.notify();
        };

        // Search Bar Handler (Parses window size like 100x140, presets, or material names with live catalog prices)
        window.handleCalcSearch = (query) => {
            window.calcSearchQuery = query;
            const q = (query || '').trim().toLowerCase();
            if (!q) {
                window.calcMaterialSearchQuery = '';
                Store.notify();
                return;
            }

            // Check for dimension syntax like "100x140", "150*140", "50 x 140"
            const dimMatch = q.match(/(\d+(?:\.\d+)?)\s*[*xX×]\s*(\d+(?:\.\d+)?)/);
            if (dimMatch) {
                const w = parseFloat(dimMatch[1]);
                const h = parseFloat(dimMatch[2]);
                if (w > 0 && h > 0) {
                    if (Store.state.quoteStudio && Store.state.quoteStudio.step === 'canvas' && Store.state.quoteStudio.currentWindow) {
                        const cw = Store.state.quoteStudio.currentWindow;
                        cw.totalW = w;
                        cw.totalH = h;
                        const baseWCm = convertUnit(w, cw.unit, 'cm');
                        const estimatedCols = Math.max(1, Math.min(6, Math.round(baseWCm / 50)));
                        cw.cols = estimatedCols;
                        const paneW = parseFloat((w / estimatedCols).toFixed(1));
                        cw.paneWidths = Array(estimatedCols).fill(paneW);
                        cw.panePartitions = Array(estimatedCols).fill(0);
                        cw.partitionPos = Array(estimatedCols).fill('top');
                        Store.notify();
                        return;
                    }
                    snapshotCalc();
                    g.totalW = w;
                    g.totalH = h;
                    const baseWCm = convertUnit(w, g.unit, 'cm');
                    const estimatedCols = Math.max(1, Math.min(6, Math.round(baseWCm / 50)));
                    g.cols = estimatedCols;
                    const paneW = parseFloat((w / estimatedCols).toFixed(1));
                    g.paneWidths = Array(estimatedCols).fill(paneW);
                    g.panePartitions = Array(estimatedCols).fill(0);
                    g.partitionPos = Array(estimatedCols).fill('top');
                    Store.notify();
                    return;
                }
            }

            // Check for "1 kalli", "2 kalli", etc.
            const kalliMatch = q.match(/(\d)\s*kalli/);
            if (kalliMatch) {
                if (Store.state.quoteStudio && Store.state.quoteStudio.step === 'canvas') {
                    window.loadStudioPreset(parseInt(kalliMatch[1]));
                } else {
                    window.loadPreset(parseInt(kalliMatch[1]));
                }
                return;
            }

            // Filter materials
            window.calcMaterialSearchQuery = q;
            window.studioMaterialSearchQuery = q;
            Store.notify();
        };

        const generatedModelTitle = `WINDOW W${g.cols} (${g.totalW}x${g.totalH} ${g.unit})`;

        // Visual Frame Thickness derived from Profile item (user requested animation & matching profile thickness):
        // 4x2.5 (40mm) -> 8px (sleek)
        // 5x2.5 (45mm) -> 10px
        // 4x3 (48mm) -> 11px
        // 5x3 (50mm) -> 12px (solid default)
        // Heavy Z (60mm) -> 15px
        // Step Rebated (65mm) -> 16px
        // 2D Frame Dimensions:
        const maxAvailW = 660;
        const maxAvailH = 310;
        const aspect = (w_mm > 0 && h_mm > 0) ? (w_mm / h_mm) : (g.cols * 50 / 140);
        let drawW, drawH;
        if (aspect >= (maxAvailW / maxAvailH)) {
            drawW = maxAvailW;
            drawH = Math.max(100, Math.round(drawW / aspect));
        } else {
            drawH = maxAvailH;
            drawW = Math.max(90, Math.round(drawH * aspect));
        }

        const is4x3 = String(rc.materials?.frame || '').toLowerCase().includes('4x3') || String(frameItem.name || '').toLowerCase().includes('4x3');
        const frameThick = is4x3 ? Math.max(14, Math.round(drawH * 0.052)) : Math.max(9, Math.round(drawH * 0.038));
        const mullionThick = Math.max(6, Math.round(frameThick * 0.72));
        const sashThick = Math.max(5, Math.round(frameThick * 0.65));
        const sashGap = 1.5; // TIGHT REBATE CLEARANCE (adippichu - no over-gap)

        const hasPanel = rc.materials?.panel !== 'none' && rc.materials?.panel !== '' && !panelItem.isNone;
        const profileFill = '#4a4d52';
        const profileStroke = '#181a1b';
        const strokeW = 1.5;
        const glassFill = '#ffffff';

        let gridSvg = '';
        let paneOverlays = '';
        let currentPaneLeft = frameThick;
        let bestHorizDim = null;
        let bestVertDim = null;
        const innerH = drawH - (frameThick * 2);
        const totalInnerW = drawW - (frameThick * 2) - ((g.cols - 1) * mullionThick);
        const panePositions = [];

        for (let i = 0; i < g.cols; i++) {
            const paneFraction = (g.paneWidths[i] && g.totalW > 0) ? (g.paneWidths[i] / g.totalW) : (1 / g.cols);
            const drawPaneW = Math.max(10, Math.round(totalInnerW * paneFraction));
            const parts = g.panePartitions[i] || 0;
            const pos = (g.partitionPos && g.partitionPos[i]) || 'top';
            const isVert = parts >= 1 && ((g.partitionDir && g.partitionDir[i] === 'vertical') || pos === 'vertical');

            panePositions.push({ startX: currentPaneLeft, endX: currentPaneLeft + drawPaneW, w: drawPaneW, i });

            // Sub-sections in this pane
            const subSections = [];
            if (parts === 0) {
                subSections.push({ x: currentPaneLeft, y: frameThick, w: drawPaneW, h: innerH, isVert: false, subName: 'Full Pane' });
            } else if (isVert) {
                let pxFrac = 0.50;
                if (pos === 'left') pxFrac = 0.35;
                else if (pos === 'right') pxFrac = 0.65;
                const w1 = Math.round((drawPaneW - mullionThick) * pxFrac);
                const w2 = drawPaneW - mullionThick - w1;
                subSections.push({ x: currentPaneLeft, y: frameThick, w: w1, h: innerH, isVert: true, subName: 'Left Opening' });
                subSections.push({ x: currentPaneLeft + w1 + mullionThick, y: frameThick, w: w2, h: innerH, isVert: true, subName: 'Right Opening' });
            } else if (parts === 1) {
                let pyFraction = 0.35;
                if (g.partitionHeights && g.partitionHeights[i]) {
                    pyFraction = Math.max(0.1, Math.min(0.9, g.partitionHeights[i] / totHCm));
                } else if (pos === 'quarter') {
                    pyFraction = 0.25;
                } else if (pos === 'center') {
                    pyFraction = 0.50;
                } else if (pos === 'bottom') {
                    pyFraction = 0.65;
                } else if (pos === 'threequarter') {
                    pyFraction = 0.75;
                }
                const h1 = Math.round((innerH - mullionThick) * pyFraction);
                const h2 = innerH - mullionThick - h1;

                // Check if top opening has vertical sub-partition (Audio 2)
                if (g.subPartitions && g.subPartitions[`${i}_0`] === 'vertical') {
                    const w1 = Math.round((drawPaneW - mullionThick) / 2);
                    const w2 = drawPaneW - mullionThick - w1;
                    subSections.push({ x: currentPaneLeft, y: frameThick, w: w1, h: h1, isVert: false, subName: 'Top-Left Opening', sOrig: 0, hasSubMullion: true });
                    subSections.push({ x: currentPaneLeft + w1 + mullionThick, y: frameThick, w: w2, h: h1, isVert: false, subName: 'Top-Right Opening', sOrig: 0 });
                } else {
                    subSections.push({ x: currentPaneLeft, y: frameThick, w: drawPaneW, h: h1, isVert: false, subName: 'Top Opening', sOrig: 0 });
                }

                // Check if bottom opening has vertical sub-partition (Audio 2)
                if (g.subPartitions && g.subPartitions[`${i}_1`] === 'vertical') {
                    const w1 = Math.round((drawPaneW - mullionThick) / 2);
                    const w2 = drawPaneW - mullionThick - w1;
                    subSections.push({ x: currentPaneLeft, y: frameThick + h1 + mullionThick, w: w1, h: h2, isVert: false, subName: 'Bottom-Left Opening', sOrig: 1, hasSubMullion: true });
                    subSections.push({ x: currentPaneLeft + w1 + mullionThick, y: frameThick + h1 + mullionThick, w: w2, h: h2, isVert: false, subName: 'Bottom-Right Opening', sOrig: 1 });
                } else {
                    subSections.push({ x: currentPaneLeft, y: frameThick + h1 + mullionThick, w: drawPaneW, h: h2, isVert: false, subName: 'Main Opening', sOrig: 1 });
                }
            } else {
                const hEach = Math.round((innerH - (parts * mullionThick)) / (parts + 1));
                for (let p = 0; p <= parts; p++) {
                    subSections.push({ x: currentPaneLeft, y: frameThick + (p * (hEach + mullionThick)), w: drawPaneW, h: hEach, isVert: false, subName: `Opening ${p+1}` });
                }
            }

            // If vertical partition, draw the vertical divider mullion
            if (isVert) {
                const w1 = subSections[0].w;
                gridSvg += `<rect x="${currentPaneLeft + w1}" y="${frameThick}" width="${mullionThick}" height="${innerH}" fill="${profileFill}" stroke="${profileStroke}" stroke-width="${strokeW}" rx="0.5" />`;
            }

            // If sub-mullions exist within an opening (Audio 2), draw them
            for (let s = 0; s < subSections.length; s++) {
                if (subSections[s].hasSubMullion) {
                    gridSvg += `<rect x="${subSections[s].x + subSections[s].w}" y="${subSections[s].y}" width="${mullionThick}" height="${subSections[s].h}" fill="${profileFill}" stroke="${profileStroke}" stroke-width="${strokeW}" rx="0.5" />`;
                }
            }

            // Render sub-sections as apertures cutout into the solid frame
            for (let s = 0; s < subSections.length; s++) {
                const sec = subSections[s];
                let innerApertureX = sec.x;
                let innerApertureY = sec.y;
                let innerApertureW = sec.w;
                let innerApertureH = sec.h;

                if (hasPanel) {
                    // Outer aperture rebate border (white hairline / rebate opening)
                    gridSvg += `<rect x="${sec.x}" y="${sec.y}" width="${sec.w}" height="${sec.h}" fill="#ffffff" stroke="${profileStroke}" stroke-width="${strokeW}" />`;
                    const sX = sec.x + sashGap;
                    const sY = sec.y + sashGap;
                    const sW = sec.w - (sashGap * 2);
                    const sH = sec.h - (sashGap * 2);
                    if (sW > sashThick * 2 && sH > sashThick * 2) {
                        gridSvg += `<rect x="${sX}" y="${sY}" width="${sW}" height="${sH}" fill="${profileFill}" stroke="${profileStroke}" stroke-width="${strokeW}" />`;
                        const gX = sX + sashThick;
                        const gY = sY + sashThick;
                        const gW = sW - (sashThick * 2);
                        const gH = sH - (sashThick * 2);
                        gridSvg += `<rect x="${gX}" y="${gY}" width="${gW}" height="${gH}" fill="${glassFill}" stroke="${profileStroke}" stroke-width="${strokeW * 0.8}" />`;
                        innerApertureX = gX;
                        innerApertureY = gY;
                        innerApertureW = gW;
                        innerApertureH = gH;
                    }
                } else {
                    gridSvg += `<rect x="${sec.x}" y="${sec.y}" width="${sec.w}" height="${sec.h}" fill="${glassFill}" stroke="${profileStroke}" stroke-width="${strokeW}" />`;
                }

                // Security Grill Tubes inside aperture (20x20 Square Tubes)
                const secW_cm = (sec.w / totalInnerW) * totalInnerWCm;
                const secH_cm = (sec.h / innerH) * totalInnerHCm;
                const sIdx = sec.sOrig !== undefined ? sec.sOrig : s;
                const subKey = `${i}_${sIdx}`;
                const paneOrient = (g.subOrientations && g.subOrientations[subKey]) || (g.paneTubeOrientations && g.paneTubeOrientations[i]) || 'horizontal';
                const paneCount = (g.subTubeCounts && g.subTubeCounts[subKey]) ?? (g.paneTubeCounts ? g.paneTubeCounts[i] : null);
                const grill = computePaneGrill(secW_cm, secH_cm, paneOrient, paneCount);

                const pipeThickPx = Math.max(3, Math.round(drawH * (2.0 / Math.max(20, convertUnit(g.totalH, g.unit, 'cm')))));
                if (grill.count > 0 && innerApertureW > pipeThickPx * 2 && innerApertureH > pipeThickPx * 2) {
                    if (paneOrient === 'horizontal') {
                        const gapPx = (innerApertureH - (grill.count * pipeThickPx)) / (grill.count + 1);
                        for (let p = 0; p < grill.count; p++) {
                            const py = innerApertureY + gapPx * (p + 1) + pipeThickPx * p;
                            gridSvg += `<rect x="${innerApertureX}" y="${py}" width="${innerApertureW}" height="${pipeThickPx}" fill="#ffffff" stroke="#334155" stroke-width="1.1" rx="0.5" />`;
                        }
                        const isPart = (g.panePartitions && g.panePartitions[i] > 0);
                        const isMainArea = isPart ? (s > 0) : true;
                        let hScore = innerApertureH;
                        if (isMainArea) hScore += 600;
                        if (i === g.cols - 1 || i === g.activePaneIndex) hScore += 100;

                        if (!bestHorizDim || hScore > bestHorizDim.score) {
                            bestHorizDim = {
                                innerApertureX, innerApertureY, innerApertureW, innerApertureH,
                                gapPx, pipeThickPx, gapCm: grill.gapCm, i, s, score: hScore, count: grill.count
                            };
                        }
                    } else {
                        const gapPx = (innerApertureW - (grill.count * pipeThickPx)) / (grill.count + 1);
                        for (let p = 0; p < grill.count; p++) {
                            const px = innerApertureX + gapPx * (p + 1) + pipeThickPx * p;
                            gridSvg += `<rect x="${px}" y="${innerApertureY}" width="${pipeThickPx}" height="${innerApertureH}" fill="#ffffff" stroke="#334155" stroke-width="1.1" rx="0.5" />`;
                        }
                        if (!bestVertDim || s === 0 || i === g.activePaneIndex) {
                            bestVertDim = {
                                innerApertureX, innerApertureY, innerApertureW, innerApertureH,
                                gapPx, pipeThickPx, gapCm: grill.gapCm, i, s, count: grill.count
                            };
                        }
                    }
                }
            }

            const isSelected = (g.activePaneIndex === i);
            const posDisplay = isVert ? 'VERT' : (pos === 'center' ? 'MID' : (pos === 'bottom' ? 'BTM' : 'TOP'));

            // HTML Overlay for this Pane (Audio: Clean sub-section targets, hover-only ultra-compact transparent badge, NO text labels)
            paneOverlays += `
                <div class="pane-hover-cell ${isSelected ? 'is-selected' : ''}" id="pane-hover-cell-${i}" style="position: absolute; left: ${currentPaneLeft}px; top: 0; width: ${drawPaneW}px; height: ${drawH}px; pointer-events: none;">
                    
                    <!-- Direct Sub-Section Click Targets -->
                    ${subSections.length > 1 ? subSections.map((sec, sIdx) => {
                        const targetSubIdx = sec.sOrig !== undefined ? sec.sOrig : sIdx;
                        const isSubActive = (g.activePaneIndex === i && (g.activeSubIndex ?? 0) === targetSubIdx);
                        const subLabel = sec.subName || (sIdx === 0 ? 'Opening 1' : 'Opening 2');
                        return `
                            <div 
                                onclick="window.handleSubPaneClick(${i}, ${targetSubIdx})"
                                title="Pane ${i + 1} (${subLabel}): Click to select • Press R to rotate grill"
                                style="position: absolute; left: ${sec.x - currentPaneLeft}px; top: ${sec.y}px; width: ${sec.w}px; height: ${sec.h}px; cursor: pointer; pointer-events: auto; z-index: 10; border-radius: 2px; transition: background 0.15s ease; ${isSubActive ? 'background: rgba(2, 132, 199, 0.08);' : ''}"
                                onmouseenter="this.style.backgroundColor='rgba(15, 23, 42, 0.06)'; const b = document.getElementById('pane-part-badge-${i}'); if(b) b.style.opacity='1';"
                                onmouseleave="this.style.backgroundColor='${isSubActive ? 'rgba(2, 132, 199, 0.08)' : 'transparent'}'; const b = document.getElementById('pane-part-badge-${i}'); if(b && !${isSelected}) b.style.opacity='0';"
                            ></div>
                        `;
                    }).join('') : `
                        <div 
                            onclick="window.handleSubPaneClick(${i}, 0)"
                            title="Pane ${i + 1} of ${g.cols}: Click to apply active command or select • Shortcuts: PT (Top), PM (Mid), PB (Btm), PV (Vertical), R (Rotate)"
                            style="position: absolute; left: 0; top: ${frameThick}px; width: ${drawPaneW}px; height: ${innerH}px; cursor: pointer; pointer-events: auto; z-index: 10; border-radius: 2px; transition: background 0.15s ease; ${isSelected ? 'background: rgba(2, 132, 199, 0.08);' : ''}"
                            onmouseenter="this.style.backgroundColor='rgba(15, 23, 42, 0.06)'; const b = document.getElementById('pane-part-badge-${i}'); if(b) b.style.opacity='1';"
                            onmouseleave="this.style.backgroundColor='${isSelected ? 'rgba(2, 132, 199, 0.08)' : 'transparent'}'; const b = document.getElementById('pane-part-badge-${i}'); if(b && !${isSelected}) b.style.opacity='0';"
                        ></div>
                    `}

                    <!-- Partition Reference Position Pill (Audio: Transparent glassmorphism, ultra-compact number + arrow only, hover-only) -->
                    <div 
                        id="pane-part-badge-${i}"
                        class="pane-partition-pill-badge ${isSelected ? 'is-selected' : ''}"
                        onclick="event.stopPropagation(); window.openPartitionPosDropdown(${i}, this)" 
                        title="Pane ${i + 1}: Click to choose partitions (0, 1, 2, 3, 4, 5)"
                        onmouseenter="this.style.opacity='1';"
                        onmouseleave="if(!${isSelected}) this.style.opacity='0';"
                        style="
                            position: absolute; 
                            left: 50%; 
                            top: ${Math.round(frameThick + 6)}px; 
                            transform: translateX(-50%); 
                            pointer-events: auto; 
                            z-index: 25;
                            background: ${parts === 0 ? 'rgba(255, 255, 255, 0.40)' : 'rgba(255, 255, 255, 0.55)'}; 
                            border: 1.5px ${parts === 0 ? 'dashed rgba(100, 116, 139, 0.45)' : 'solid rgba(2, 132, 199, 0.60)'}; 
                            backdrop-filter: blur(4px);
                            -webkit-backdrop-filter: blur(4px);
                            border-radius: 5px; 
                            padding: 2px 7px; 
                            display: inline-flex; 
                            align-items: center; 
                            justify-content: center;
                            gap: 3px;
                            cursor: pointer; 
                            box-shadow: 0 1px 3px rgba(0,0,0,0.08); 
                            user-select: none; 
                            opacity: ${isSelected ? '1' : '0'};
                            transition: opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1), transform 0.15s ease, background 0.15s ease;
                        "
                        onmouseover="this.style.background='rgba(255, 255, 255, 0.90)'; this.style.borderColor='#0284c7'; this.style.transform='translateX(-50%) scale(1.06)';"
                        onmouseout="this.style.background='${parts === 0 ? 'rgba(255, 255, 255, 0.40)' : 'rgba(255, 255, 255, 0.55)'}'; this.style.borderColor='${parts === 0 ? 'rgba(100, 116, 139, 0.45)' : 'rgba(2, 132, 199, 0.60)'}'; this.style.transform='translateX(-50%) scale(1)';"
                    >
                        <span style="font-size: 0.82rem; font-weight: 800; color: ${parts === 0 ? '#64748b' : '#0284c7'}; line-height: 1;">${parts}</span>
                        <span style="font-size: 0.52rem; color: ${parts === 0 ? '#94a3b8' : '#0284c7'}; line-height: 1; opacity: 0.85;">▼</span>
                        ${parts > 0 ? `
                            <span 
                                onclick="event.stopPropagation(); window.removePanePartition(${i});"
                                title="Remove Partition (PR)"
                                style="margin-left: 3px; font-size: 0.70rem; color: #ef4444; font-weight: 800; padding: 0 2px; cursor: pointer; border-radius: 3px; line-height: 1;"
                                onmouseover="this.style.background='rgba(239, 68, 68, 0.15)'"
                                onmouseout="this.style.background='transparent'"
                            >✕</span>
                        ` : ''}
                    </div>

                    <!-- Individual Pane Width Input: Sits cleanly at the TOP above AutoCAD dimension line -->
                    ${g.cols > 1 ? `
                        <div style="position: absolute; left: 50%; top: -56px; transform: translateX(-50%); pointer-events: auto; display: flex; flex-direction: column; align-items: center; z-index: 25;">
                            <span style="font-size: 0.62rem; color: #64748b; font-weight: 700; margin-bottom: 1px;">W(${g.unit})</span>
                            <input 
                                type="number" 
                                class="hide-spin" 
                                step="${g.unit === 'mm' ? '10' : '0.5'}" 
                                min="1" 
                                value="${g.paneWidths[i]}" 
                                onchange="window.updateIndividualPaneWidth(${i}, this.value)" 
                                style="width: 62px; height: 26px; text-align: center; font-weight: 700; font-size: 0.90rem; color: #0f172a; border: 1.5px solid #cbd5e1; border-radius: 5px; background: #ffffff; box-shadow: 0 1px 3px rgba(0,0,0,0.06); outline: none; padding: 1px 2px; box-sizing: border-box; -webkit-appearance: none; appearance: none; -moz-appearance: textfield; font-variant-numeric: tabular-nums;"
                            >
                        </div>
                    ` : ''}

                </div>
            `;

            currentPaneLeft += drawPaneW + (i < g.cols - 1 ? mullionThick : 0);
        }

        // AutoCAD Blueprint Dimensions Layout (Matching Reference Image 2)
        const strokeCAD = '#334155';
        const strokeW_CAD = 1.1;
        const fontFam = 'monospace';

        // 1. Top Dimensions: Individual Pane Widths (Image 2: 41, 100, 41)
        for (let pIdx = 0; pIdx < panePositions.length; pIdx++) {
            const pos = panePositions[pIdx];
            const pX1 = pos.startX;
            const pX2 = pos.endX;
            const dimY = -18;
            const paneWCm = Math.round(convertUnit(g.paneWidths[pIdx] || (g.totalW / g.cols), g.unit, 'cm'));

            // Witness lines
            gridSvg += `<line x1="${pX1}" y1="0" x2="${pX1}" y2="${dimY - 6}" stroke="${strokeCAD}" stroke-width="0.9" />`;
            gridSvg += `<line x1="${pX2}" y1="0" x2="${pX2}" y2="${dimY - 6}" stroke="${strokeCAD}" stroke-width="0.9" />`;
            // Dimension line
            gridSvg += `<line x1="${pX1}" y1="${dimY}" x2="${pX2}" y2="${dimY}" stroke="${strokeCAD}" stroke-width="${strokeW_CAD}" />`;
            // Tick marks
            gridSvg += `<line x1="${pX1 - 3}" y1="${dimY + 3}" x2="${pX1 + 3}" y2="${dimY - 3}" stroke="${strokeCAD}" stroke-width="1.3" />`;
            gridSvg += `<line x1="${pX2 - 3}" y1="${dimY + 3}" x2="${pX2 + 3}" y2="${dimY - 3}" stroke="${strokeCAD}" stroke-width="1.3" />`;
            // Dimension text
            gridSvg += `<text x="${(pX1 + pX2) / 2}" y="${dimY - 4}" fill="#0f172a" font-size="11px" font-weight="700" font-family="${fontFam}" text-anchor="middle">${paneWCm}</text>`;
        }

        // 2. Bottom Dimension: Total Window Width (Image 2: 200)
        const botDimY = drawH + 20;
        gridSvg += `
            <line x1="0" y1="${drawH}" x2="0" y2="${botDimY + 6}" stroke="${strokeCAD}" stroke-width="0.9" />
            <line x1="${drawW}" y1="${drawH}" x2="${drawW}" y2="${botDimY + 6}" stroke="${strokeCAD}" stroke-width="0.9" />
            <line x1="0" y1="${botDimY}" x2="${drawW}" y2="${botDimY}" stroke="${strokeCAD}" stroke-width="1.2" />
            <line x1="-3" y1="${botDimY + 3}" x2="3" y2="${botDimY - 3}" stroke="${strokeCAD}" stroke-width="1.4" />
            <line x1="${drawW - 3}" y1="${botDimY + 3}" x2="${drawW + 3}" y2="${botDimY - 3}" stroke="${strokeCAD}" stroke-width="1.4" />
            <text x="${drawW / 2}" y="${botDimY + 14}" fill="#0f172a" font-size="12px" font-weight="800" font-family="${fontFam}" text-anchor="middle">${totWCm}</text>
        `;

        // 3. Right Dimension: Total Window Height (Image 2: 160)
        const rightDimX = drawW + 24;
        gridSvg += `
            <line x1="${drawW}" y1="0" x2="${rightDimX + 6}" y2="0" stroke="${strokeCAD}" stroke-width="0.9" />
            <line x1="${drawW}" y1="${drawH}" x2="${rightDimX + 6}" y2="${drawH}" stroke="${strokeCAD}" stroke-width="0.9" />
            <line x1="${rightDimX}" y1="0" x2="${rightDimX}" y2="${drawH}" stroke="${strokeCAD}" stroke-width="1.2" />
            <line x1="${rightDimX - 3}" y1="3" x2="${rightDimX + 3}" y2="-3" stroke="${strokeCAD}" stroke-width="1.4" />
            <line x1="${rightDimX - 3}" y1="${drawH + 3}" x2="${rightDimX + 3}" y2="${drawH - 3}" stroke="${strokeCAD}" stroke-width="1.4" />
            <text x="${rightDimX + 8}" y="${drawH / 2 + 4}" fill="#0f172a" font-size="12px" font-weight="800" font-family="${fontFam}" text-anchor="start">${totHCm}</text>
        `;

        // 4. Left Dimension: Partition Heights (Panel Outer-to-Outer / Poli)
        const horizPartIdx = g.panePartitions ? g.panePartitions.findIndex((p, idx) => p > 0 && g.partitionDir?.[idx] !== 'vertical') : -1;
        const leftDimX = -24;
        let partitionDimInputs = '';
        if (horizPartIdx !== -1) {
            const hPos = g.partitionPos[horizPartIdx] || 'top';
            let pyFrac = 0.35;
            if (g.partitionHeights && g.partitionHeights[horizPartIdx]) {
                pyFrac = Math.max(0.1, Math.min(0.9, g.partitionHeights[horizPartIdx] / totHCm));
            } else if (hPos === 'quarter') {
                pyFrac = 0.25;
            } else if (hPos === 'center') {
                pyFrac = 0.50;
            } else if (hPos === 'bottom') {
                pyFrac = 0.65;
            } else if (hPos === 'threequarter') {
                pyFrac = 0.75;
            }
            const h1 = Math.round((innerH - mullionThick) * pyFrac);
            const panelTopY = frameThick;
            const divTopY = frameThick + h1;
            const divBottomY = divTopY + mullionThick;
            const panelBottomY = frameThick + innerH;
            
            const topHCm = g.partitionHeights?.[horizPartIdx] ? Math.round(g.partitionHeights[horizPartIdx]) : Math.round(totHCm * pyFrac);
            const botHCm = Math.max(1, totHCm - topHCm);

            gridSvg += `
                <!-- Top Panel (Poli) Outer-to-Outer Dimension Lines -->
                <line x1="0" y1="${panelTopY}" x2="${leftDimX - 6}" y2="${panelTopY}" stroke="${strokeCAD}" stroke-width="0.9" />
                <line x1="0" y1="${divTopY}" x2="${leftDimX - 6}" y2="${divTopY}" stroke="${strokeCAD}" stroke-width="0.9" />
                <line x1="${leftDimX}" y1="${panelTopY}" x2="${leftDimX}" y2="${divTopY}" stroke="${strokeCAD}" stroke-width="${strokeW_CAD}" />
                <line x1="${leftDimX - 3}" y1="${panelTopY + 3}" x2="${leftDimX + 3}" y2="${panelTopY - 3}" stroke="${strokeCAD}" stroke-width="1.4" />
                <line x1="${leftDimX - 3}" y1="${divTopY + 3}" x2="${leftDimX + 3}" y2="${divTopY - 3}" stroke="${strokeCAD}" stroke-width="1.4" />

                <!-- Bottom Panel (Poli) Outer-to-Outer Dimension Lines -->
                <line x1="0" y1="${divBottomY}" x2="${leftDimX - 6}" y2="${divBottomY}" stroke="${strokeCAD}" stroke-width="0.9" />
                <line x1="0" y1="${panelBottomY}" x2="${leftDimX - 6}" y2="${panelBottomY}" stroke="${strokeCAD}" stroke-width="0.9" />
                <line x1="${leftDimX}" y1="${divBottomY}" x2="${leftDimX}" y2="${panelBottomY}" stroke="${strokeCAD}" stroke-width="${strokeW_CAD}" />
                <line x1="${leftDimX - 3}" y1="${divBottomY + 3}" x2="${leftDimX + 3}" y2="${divBottomY - 3}" stroke="${strokeCAD}" stroke-width="1.4" />
                <line x1="${leftDimX - 3}" y1="${panelBottomY + 3}" x2="${leftDimX + 3}" y2="${panelBottomY - 3}" stroke="${strokeCAD}" stroke-width="1.4" />
            `;

            // Inline Compact Editable Dimension Inputs (Audio: Click 49 to type 53)
            const topInputY = Math.round((panelTopY + divTopY) / 2 - 12);
            const botInputY = Math.round((divBottomY + panelBottomY) / 2 - 12);
            const inputLeft = leftDimX - 44; // -68px

            partitionDimInputs = `
                <!-- Editable Top Panel (Poli) Height Dimension (Audio: Click 49 to type 53) -->
                <div style="position: absolute; left: ${inputLeft}px; top: ${topInputY}px; width: 40px; height: 24px; pointer-events: auto; z-index: 25;">
                    <input 
                        type="number" 
                        class="calc-dim-input" 
                        value="${topHCm}" 
                        min="5" 
                        max="${totHCm - 5}" 
                        step="1"
                        id="calc-top-dim-input"
                        title="Top panel (poli) height: Click to edit (e.g. 53)"
                        onfocus="this.select()"
                        onchange="window.updatePartitionPanelHeight(${horizPartIdx}, this.value)"
                        onkeydown="if(event.key==='Enter'){ window.updatePartitionPanelHeight(${horizPartIdx}, this.value); this.blur(); }"
                        style="width: 100%; height: 100%; font-size: 0.84rem; font-weight: 800; padding: 0;"
                    >
                </div>

                <!-- Editable Bottom Panel Height Dimension -->
                <div style="position: absolute; left: ${inputLeft}px; top: ${botInputY}px; width: 40px; height: 24px; pointer-events: auto; z-index: 25;">
                    <input 
                        type="number" 
                        class="calc-dim-input" 
                        value="${botHCm}" 
                        min="5" 
                        max="${totHCm - 5}" 
                        step="1"
                        id="calc-bot-dim-input"
                        title="Bottom panel height: Click to edit"
                        onfocus="this.select()"
                        onchange="window.updatePartitionPanelHeight(${horizPartIdx}, ${totHCm} - (parseFloat(this.value) || 0))"
                        onkeydown="if(event.key==='Enter'){ window.updatePartitionPanelHeight(${horizPartIdx}, ${totHCm} - (parseFloat(this.value) || 0)); this.blur(); }"
                        style="width: 100%; height: 100%; font-size: 0.84rem; font-weight: 800; padding: 0;"
                    >
                </div>
            `;
        } else if (g.cols === 1) {
            gridSvg += `
                <line x1="0" y1="0" x2="${leftDimX - 6}" y2="0" stroke="${strokeCAD}" stroke-width="0.9" />
                <line x1="0" y1="${drawH}" x2="${leftDimX - 6}" y2="${drawH}" stroke="${strokeCAD}" stroke-width="0.9" />
                <line x1="${leftDimX}" y1="0" x2="${leftDimX}" y2="${drawH}" stroke="${strokeCAD}" stroke-width="${strokeW_CAD}" />
                <line x1="${leftDimX - 3}" y1="3" x2="${leftDimX + 3}" y2="-3" stroke="${strokeCAD}" stroke-width="1.4" />
                <line x1="${leftDimX - 3}" y1="${drawH + 3}" x2="${leftDimX + 3}" y2="${drawH - 3}" stroke="${strokeCAD}" stroke-width="1.4" />
                <text x="${leftDimX - 8}" y="${drawH / 2 + 4}" fill="#0f172a" font-size="11px" font-weight="700" font-family="${fontFam}" text-anchor="end">${totHCm}</text>
            `;
        }

        // 5. Inner Aperture Grill Gap Callouts (Image 2: 7.8)
        if (bestVertDim && bestVertDim.gapCm > 0) {
            const p = Math.max(0, Math.floor(((bestVertDim.count || 2) - 1) / 2));
            const x1 = bestVertDim.innerApertureX + bestVertDim.gapPx * (p + 1) + bestVertDim.pipeThickPx * p;
            const x2 = x1 + bestVertDim.gapPx;
            const midY = bestVertDim.innerApertureY + bestVertDim.innerApertureH / 2;
            gridSvg += `
                <line x1="${x1}" y1="${midY}" x2="${x2}" y2="${midY}" stroke="#16a34a" stroke-width="1.2" />
                <line x1="${x1}" y1="${midY - 4}" x2="${x1}" y2="${midY + 4}" stroke="#16a34a" stroke-width="1.1" />
                <line x1="${x2}" y1="${midY - 4}" x2="${x2}" y2="${midY + 4}" stroke="#16a34a" stroke-width="1.1" />
                <text x="${(x1 + x2) / 2}" y="${midY - 5}" fill="#16a34a" font-size="10.5px" font-weight="700" font-family="${fontFam}" text-anchor="middle">${bestVertDim.gapCm}</text>
            `;
        }
        if (bestHorizDim && bestHorizDim.gapCm > 0) {
            const p = Math.max(0, Math.floor(((bestHorizDim.count || 2) - 1) / 2));
            const y1 = bestHorizDim.innerApertureY + bestHorizDim.gapPx * (p + 1) + bestHorizDim.pipeThickPx * p;
            const y2 = y1 + bestHorizDim.gapPx;
            const midX = bestHorizDim.innerApertureX + bestHorizDim.innerApertureW / 2;
            gridSvg += `
                <line x1="${midX}" y1="${y1}" x2="${midX}" y2="${y2}" stroke="#16a34a" stroke-width="1.2" />
                <line x1="${midX - 4}" y1="${y1}" x2="${midX + 4}" y2="${y1}" stroke="#16a34a" stroke-width="1.1" />
                <line x1="${midX - 4}" y1="${y2}" x2="${midX + 4}" y2="${y2}" stroke="#16a34a" stroke-width="1.1" />
                <text x="${midX + 7}" y="${(y1 + y2) / 2 + 3.5}" fill="#16a34a" font-size="10.5px" font-weight="700" font-family="${fontFam}" text-anchor="start">${bestHorizDim.gapCm}</text>
            `;
        }

        // Material Dropdown Builder with '-- None (Not Included) --' (Native Select Options)
        const renderMatCol = (catKey, label, allowedCats, currentVal) => {
            const items = catalog.filter(m => {
                const cat = (m.category || '').toLowerCase().trim();
                return allowedCats.some(c => {
                    const lc = c.toLowerCase().trim();
                    return cat === lc || cat.includes(lc) || lc.includes(cat);
                });
            });

            return `
                <div style="display: flex; flex-direction: column; gap: 4px; min-width: 0;">
                    <label style="font-size: 0.72rem; font-weight: 700; color: #475569; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${escapeHtmlAttr(label)}">${label}</label>
                    <select 
                        id="quick-mat-${catKey}" 
                        class="calc-mat-select" 
                        onchange="window.updateGrid('mat_${catKey}', this.value)" 
                        style="width: 100%; height: 32px; padding: 4px 6px; border: 1.5px solid #cbd5e1; border-radius: 6px; font-size: 0.78rem; font-weight: 600; color: #0f172a; background: #ffffff; outline: none; cursor: pointer; text-overflow: ellipsis;"
                    >
                        <option value="none" ${currentVal === 'none' ? 'selected' : ''}>-- None (Not Included) --</option>
                        ${items.map(m => `
                            <option value="${escapeHtmlAttr(m.id)}" ${(currentVal === m.id || currentVal === m.name) ? 'selected' : ''}>${escapeHtmlAttr(m.name)}</option>
                        `).join('')}
                    </select>
                </div>
            `;
        };

        const totalWTop = 'calc(100% + 36px)';

        return `
            <div class="quick-calc-container" style="display: flex; flex-direction: column; gap: 1.5rem; max-width: 1300px; margin: 0 auto; padding-bottom: 3rem;">
                
                <!-- 1. TOP HEADER & MATERIAL CONTROLS (Audios 4 & 5, Image 3) -->
                <div style="background: white; border: 1px solid #cbd5e1; border-radius: 8px; padding: 14px 18px; box-shadow: 0 2px 6px rgba(0,0,0,0.04);">
                    
                    <!-- Row 1: Model Title (Left), Search Bar (Center/Left), Unit Selector (Right) -->
                    <div style="display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 14px;">
                        
                        <!-- Design Model Title (Image 3) -->
                        <div style="display: flex; flex-direction: column; min-width: 170px;">
                            <span style="font-size: 0.68rem; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">DESIGN MODEL</span>
                            <span style="font-size: 1.25rem; font-weight: 900; color: #0284c7; line-height: 1.2;">WINDOW W${g.cols} (${g.totalW}x${g.totalH} ${g.unit})</span>
                        </div>

                        <!-- Search Bar with Autocomplete Dropdown (Audio 4: Positioned on Left) -->
                        <div style="flex: 1; max-width: 440px; min-width: 240px; position: relative;" id="calc-search-container">
                            <div style="position: relative; display: flex; align-items: center;">
                                <span style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); font-size: 0.85rem; color: #64748b; pointer-events: none; z-index: 2;">🔍</span>
                                <input 
                                    type="text" 
                                    id="calc-search-bar" 
                                    autocomplete="off"
                                    placeholder="Search window presets, types, or dimensions (e.g. 150x140)..." 
                                    value="${window.calcSearchQuery || ''}"
                                    onfocus="window.openCalcSearchDropdown(this.value)"
                                    oninput="window.handleCalcSearchInput(this.value)"
                                    onkeydown="window.handleCalcSearchKey(event)"
                                    style="width: 100%; padding: 7px 32px 7px 32px; border: 1.5px solid #cbd5e1; border-radius: 6px; font-size: 0.84rem; outline: none; background: #ffffff !important; color: #0f172a !important; font-weight: 600; caret-color: #0284c7; box-shadow: inset 0 1px 2px rgba(0,0,0,0.04);"
                                >
                                <button 
                                    type="button" 
                                    id="calc-search-clear-btn"
                                    onclick="window.clearCalcSearch()" 
                                    style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); background: #e2e8f0; border: none; color: #475569; width: 18px; height: 18px; border-radius: 50%; display: ${window.calcSearchQuery ? 'flex' : 'none'}; align-items: center; justify-content: center; cursor: pointer; font-size: 0.85rem; font-weight: 700; line-height: 1; padding: 0;"
                                    title="Clear search"
                                >×</button>
                            </div>

                            <div 
                                id="calc-search-dropdown" 
                                style="display: none; position: absolute; top: calc(100% + 4px); left: 0; right: 0; width: 100%; max-height: 380px; overflow-y: auto; background: #ffffff; border: 1.5px solid #0284c7; border-radius: 8px; box-shadow: 0 14px 30px -4px rgba(15, 23, 42, 0.25), 0 6px 14px -2px rgba(15, 23, 42, 0.12); z-index: 1000; text-align: left;"
                            ></div>
                        </div>

                        <!-- Unit Toggle Buttons (Audio 4: Unit Selector on Right) -->
                        <div style="display: flex; align-items: center; background: #f1f5f9; border-radius: 6px; padding: 2px; border: 1.5px solid #cbd5e1;">
                            ${['cm', 'mm', 'inch', 'ft'].map(u => `
                                <button 
                                    type="button" 
                                    onclick="window.toggleUnit('${u}')" 
                                    style="
                                        padding: 5px 12px; 
                                        font-size: 0.78rem; 
                                        font-weight: 700; 
                                        border: none; 
                                        border-radius: 4px; 
                                        cursor: pointer; 
                                        background: ${g.unit === u ? '#0284c7' : 'transparent'}; 
                                        color: ${g.unit === u ? '#ffffff' : '#64748b'};
                                        transition: all 0.15s ease;
                                    "
                                >${u.toUpperCase()}</button>
                            `).join('')}
                        </div>

                    </div>

                    <!-- Row 2: 7 Dedicated Material Dropdowns (Profile, Pipe, Panel, Hinges, Paint, Hook, Lock) -->
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 10px; margin-top: 14px; padding-top: 12px; border-top: 1px solid #e2e8f0;">
                        ${renderMatCol('frame', '1. Profile', ['profile', 'frame', 'aluminum_profile', 'al_profile'], rc.materials?.frame)}
                        ${renderMatCol('pipe', '2. Pipe', ['pipe', 'pipes', 'tube'], rc.materials?.pipe)}
                        ${renderMatCol('panel', '3. Panel', ['panel', 'panels', 'glass', 'sheet', 'acp'], rc.materials?.panel)}
                        ${renderMatCol('hinge', '4. Hinges', ['hinge', 'hinges', 'hardware'], rc.materials?.hinge)}
                        ${renderMatCol('paint', '5. Paint', ['paint', 'coating'], rc.materials?.paint)}
                        ${renderMatCol('hook', '6. Hook & Rubber', ['hook', 'rubber', 'handle'], rc.materials?.hook)}
                        ${renderMatCol('lock', '7. Lock & Accessories', ['lock', 'accessories'], rc.materials?.lock)}
                    </div>

                </div>

                <!-- 2. 2D INTERACTIVE MODEL CANVAS CONTAINER -->
                <div style="background: white; border: 1px solid #cbd5e1; border-radius: 8px; padding: 20px; box-shadow: 0 2px 6px rgba(0,0,0,0.04); position: relative;">
                    
                    <!-- Canvas Header: Custom Kalli Selector & Intermediate Partitions Controls -->
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 12px;">
                        <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                            <div style="display: flex; align-items: center; background: #0f172a; border-radius: 6px; overflow: hidden; box-shadow: 0 2px 6px rgba(0,0,0,0.15); border: 1px solid #334155;">
                                <div style="display: flex; align-items: center; padding: 0 12px; border-right: 1px solid rgba(255,255,255,0.18); background: rgba(0,0,0,0.18);">
                                    <span style="color: #e2e8f0; font-size: 0.82rem; font-weight: 600; margin-right: 8px;">Custom Kalli:</span>
                                    <input 
                                        type="number" 
                                        class="hide-spin"
                                        min="1" 
                                        max="30" 
                                        value="${g.cols}" 
                                        style="width: 44px; height: 26px; text-align: center; padding: 0; font-weight: 800; border-radius: 4px; border: 1px solid #64748b; background: #1e293b; color: white; font-size: 0.88rem; outline: none; -webkit-appearance: none; -moz-appearance: textfield; appearance: textfield;" 
                                        onchange="window.loadPreset(this.value)" 
                                        onkeydown="if(event.key==='Enter'){ window.loadPreset(this.value); this.blur(); }"
                                        title="Type any number of kalli and press Enter"
                                    >
                                </div>

                                ${[1, 2, 3, 4, 5].map((c, idx) => `
                                    <button 
                                        type="button" 
                                        onclick="window.loadPreset(${c})" 
                                        style="
                                            background: ${g.cols === c ? '#16a34a' : 'transparent'}; 
                                            color: white; 
                                            border: none; 
                                            border-right: ${idx < 4 ? '1px solid rgba(255,255,255,0.18)' : 'none'}; 
                                            padding: 6px 16px; 
                                            font-weight: 700; 
                                            font-size: 0.85rem; 
                                            cursor: pointer; 
                                            transition: all 0.15s ease-in-out;
                                            ${g.cols === c ? 'box-shadow: inset 0 0 10px rgba(0,0,0,0.25);' : ''}
                                        "
                                        title="${c} Kalli (${c * 50}x140 cm)"
                                        onmouseover="if(${g.cols !== c}) this.style.background='rgba(255,255,255,0.08)'"
                                        onmouseout="if(${g.cols !== c}) this.style.background='transparent'"
                                    >
                                        ${c} Kalli
                                    </button>
                                `).join('')}
                            </div>

                            <!-- Intermediate Partitions Stepper Control -->
                            <div style="display: flex; align-items: center; background: #0f172a; border-radius: 6px; overflow: hidden; box-shadow: 0 2px 6px rgba(0,0,0,0.15); border: 1px solid #334155;">
                                <div style="display: flex; align-items: center; padding: 4px 10px; background: rgba(0,0,0,0.18); gap: 6px;">
                                    <span style="color: #94a3b8; font-size: 0.78rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Partitions:</span>
                                    <button 
                                        type="button" 
                                        id="btn-part-minus"
                                        onclick="window.setTotalPartitions('-1')" 
                                        style="background: #334155; color: white; border: none; width: 24px; height: 24px; border-radius: 4px; cursor: pointer; font-weight: 800; font-size: 0.95rem; display: flex; align-items: center; justify-content: center;"
                                        title="Remove 1 partition"
                                    >−</button>
                                    <span id="canvas-total-partitions-badge" style="color: #38bdf8; font-weight: 900; font-size: 0.95rem; min-width: 22px; text-align: center;">${fabCalc.partitions}</span>
                                    <button 
                                        type="button" 
                                        id="btn-part-plus"
                                        onclick="window.setTotalPartitions('+1')" 
                                        style="background: #334155; color: white; border: none; width: 24px; height: 24px; border-radius: 4px; cursor: pointer; font-weight: 800; font-size: 0.95rem; display: flex; align-items: center; justify-content: center;"
                                        title="Add 1 partition"
                                    >+</button>
                                </div>
                            </div>
                        </div>

                        <div style="font-size: 0.78rem; color: #64748b; font-weight: 600;">
                            Area: <strong>${fabCalc.surfaceAreaSqM} m²</strong> (${fabCalc.surfaceAreaSqFt} sq.ft) • Perimeter: <strong>${fabCalc.outerPerimeterM} m</strong> • Profile: <strong>${fabCalc.totalProfileWeightKg} kg</strong>
                        </div>
                    </div>

                    <!-- Centering Viewport Container (Right-side panel removed per Audio 1 & Image 1; perfectly centered with clearance for AutoCAD dimensions) -->
                    <div style="position: relative; width: 100%; height: 520px; background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 8px; overflow: hidden; display: flex; align-items: center; justify-content: center; padding: 20px; box-sizing: border-box;">
                        
                        <!-- Floating Armed Command Banner -->
                        <div id="calc-armed-command-banner" style="display: ${window.calcArmedCommand ? 'flex' : 'none'}; position: absolute; top: 12px; left: 50%; transform: translateX(-50%); background: #0f172a; color: #ffffff; padding: 8px 18px; border-radius: 20px; box-shadow: 0 4px 16px rgba(0,0,0,0.25); align-items: center; gap: 12px; z-index: 50; border: 1.5px solid #38bdf8; font-size: 0.82rem;">
                            <span class="cmd-text" style="font-weight: 700;">
                                ⚡ ACTIVE COMMAND [${window.calcArmedCommand?.code || ''}]: ${window.calcArmedCommand?.title || ''} — ${window.calcArmedCommand?.help || 'Click any pane to apply'}
                            </span>
                            <button onclick="window.disarmCalcCommand()" style="background: rgba(255,255,255,0.15); border: none; color: #f1f5f9; padding: 2px 8px; border-radius: 4px; cursor: pointer; font-size: 0.75rem; font-weight: 700;">Cancel (Esc)</button>
                        </div>

                        <!-- Sleek Top-Left Floating Shortcuts Bar (Audio 1 & Audio 2: Reminds user of all commands with zero obstruction) -->
                        <div style="position: absolute; top: 14px; left: 16px; background: rgba(248, 250, 252, 0.96); backdrop-filter: blur(4px); border: 1.5px solid #cbd5e1; border-radius: 20px; padding: 4px 14px; font-size: 0.70rem; color: #475569; display: flex; align-items: center; gap: 7px; z-index: 20; box-shadow: 0 2px 8px rgba(0,0,0,0.06); pointer-events: auto;">
                            <span style="font-weight: 800; color: #0f172a;">⌨️ Shortcuts:</span>
                            <span style="cursor: pointer;" onclick="window.armCalcCommand('PARTITION_TOP', 'PT', 'Top Partition', 'Click any pane to apply Top Partition')" title="PT: Top Partition"><strong style="color: #0284c7;">PT</strong> Top</span> •
                            <span style="cursor: pointer;" onclick="window.armCalcCommand('PARTITION_MIDDLE', 'PM', 'Middle Partition', 'Click any pane to apply Middle Partition')" title="PM: Mid Partition"><strong style="color: #0284c7;">PM</strong> Mid</span> •
                            <span style="cursor: pointer;" onclick="window.armCalcCommand('PARTITION_BOTTOM', 'PB', 'Bottom Partition', 'Click any pane to apply Bottom Partition')" title="PB: Bottom Partition"><strong style="color: #0284c7;">PB</strong> Btm</span> •
                            <span style="cursor: pointer;" onclick="window.armCalcCommand('PARTITION_VERTICAL', 'PV', 'Vertical Partition', 'Click any pane to apply Vertical Partition')" title="PV: Vertical Partition"><strong style="color: #0284c7;">PV</strong> Vert</span> •
                            <span style="cursor: pointer;" onclick="window.removePanePartition()" title="PR: Remove Partition"><strong style="color: #e11d48;">PR</strong> Remove</span> •
                            <span style="cursor: pointer;" onclick="window.armCalcCommand('ROTATE_GRILL', 'R', 'Rotate Grill Pipes', 'Click any pane to rotate pipes')" title="R: Rotate Grill Pipes"><strong style="color: #0284c7;">R</strong> Rotate</span> •
                            <span style="cursor: pointer;" onclick="window.armCalcCommand('SET_PANE_PIPES', 'PPN', 'Set Pane Pipe Count', 'Click a pane to enter pipe count')" title="PPN: Set Pane Pipe Count"><strong style="color: #0284c7;">PPN</strong> Pipes</span> •
                            <span style="cursor: pointer;" onclick="window.armCalcCommand('REMOVE_PIPES', 'NP', 'Remove Pipes', 'Click a pane to remove all pipes')" title="NP: Clear Pipes"><strong style="color: #0284c7;">NP</strong> Clear</span>
                        </div>

                        <!-- Top-Right Dedicated Reset Button (Requested by User) -->
                        <button 
                            type="button" 
                            id="calc-reset-window-btn"
                            onclick="window.resetCurrentCalcWindow()" 
                            title="Reset window to clean default (removes partitions & custom widths)"
                            style="
                                position: absolute; 
                                top: 14px; 
                                right: 16px; 
                                background: #ffffff; 
                                border: 1.5px solid #cbd5e1; 
                                border-radius: 6px; 
                                padding: 5px 12px; 
                                font-size: 0.74rem; 
                                font-weight: 700; 
                                color: #475569; 
                                display: flex; 
                                align-items: center; 
                                gap: 5px; 
                                cursor: pointer; 
                                z-index: 25; 
                                box-shadow: 0 1px 3px rgba(0,0,0,0.06);
                                transition: all 0.15s ease;
                            "
                            onmouseover="this.style.borderColor='#ef4444'; this.style.color='#ef4444'; this.style.background='#fef2f2';"
                            onmouseout="this.style.borderColor='#cbd5e1'; this.style.color='#475569'; this.style.background='#ffffff';"
                        >
                            <span style="font-size: 0.85rem; line-height: 1;">↺</span> Reset
                        </button>

                        <!-- Centered Window Frame Wrapper -->
                        <!-- Centered Window Frame Wrapper (Strictly drawW x drawH, all overlays attached relative to this!) -->
                        <div style="position: relative; width: ${drawW}px; height: ${drawH}px; margin: 0 auto; transition: width 0.3s ease, height 0.3s ease;">
                            
                            <!-- SVG Window Graphics (AutoCAD Profile, Mullions & Inner Sashes) -->
                            <svg viewBox="0 0 ${drawW} ${drawH}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; overflow: visible;">
                                <rect x="0" y="0" width="${drawW}" height="${drawH}" fill="${profileFill}" stroke="${profileStroke}" stroke-width="${strokeW * 1.2}" rx="2" />
                                ${gridSvg}
                            </svg>

                            <!-- Pane Overlays (Inside the pane: Partition Pill + Position Toggle, and Pane Width) -->
                            ${paneOverlays}
                            ${partitionDimInputs}

                            <!-- Left Height Input Badge: Positioned outside the left AutoCAD partition height dimension lines -->
                            <div style="position: absolute; right: calc(100% + 78px); top: 50%; transform: translateY(-50%); display: flex; flex-direction: column; align-items: center; background: white; padding: 6px 14px; min-width: 104px; border-radius: 8px; border: 1.5px solid #cbd5e1; box-shadow: 0 2px 8px rgba(0,0,0,0.08); white-space: nowrap; z-index: 20;">
                                <div style="font-size: 0.65rem; color: #64748b; font-weight: 700; margin-bottom: 3px; text-transform: uppercase;">HEIGHT (${g.unit})</div>
                                <input type="number" class="hide-spin" step="${g.unit === 'mm' ? '10' : '0.5'}" min="1" value="${g.totalH}" onchange="window.updateGrid('totalH', this.value)" style="width: 96px; min-width: 96px; height: 34px; text-align: center; font-weight: 800; font-size: 1.15rem; color: #0284c7; border: 1.5px solid #7dd3fc; border-radius: 6px; background: #f8fafc; outline: none; line-height: 1; padding: 2px 2px; box-sizing: border-box; overflow: visible; -webkit-appearance: none; appearance: none; -moz-appearance: textfield; font-variant-numeric: tabular-nums;">
                            </div>

                            <!-- Bottom Total Width Badge: Generous Width to prevent digit truncation -->
                            <div style="position: absolute; top: ${totalWTop}; left: 50%; transform: translateX(-50%); display: flex; align-items: center; gap: 8px; background: white; padding: 6px 16px; border-radius: 8px; border: 1.5px solid #cbd5e1; box-shadow: 0 2px 8px rgba(0,0,0,0.08); white-space: nowrap; z-index: 20;">
                                <span style="font-size: 0.70rem; color: #64748b; font-weight: 700;">TOTAL W:</span>
                                <input type="number" class="hide-spin" step="${g.unit === 'mm' ? '10' : '0.5'}" min="1" value="${g.totalW}" onchange="window.updateGrid('totalW', this.value)" style="width: 96px; min-width: 96px; height: 32px; text-align: center; font-weight: 800; font-size: 1.15rem; color: #0284c7; border: 1.5px solid #7dd3fc; border-radius: 6px; background: #f8fafc; outline: none; padding: 2px 2px; box-sizing: border-box; overflow: visible; -webkit-appearance: none; appearance: none; -moz-appearance: textfield; font-variant-numeric: tabular-nums;">
                                <span style="font-size: 0.74rem; font-weight: 700; color: #475569;">${g.unit}</span>
                            </div>

                        </div>

                        <!-- Live Estimated Price Badge (Bottom Right of Canvas, Matching Photo 2) -->
                        <div style="position: absolute; right: 20px; bottom: 16px; background: #ecfdf5; border: 2px solid #10b981; border-radius: 8px; padding: 6px 14px; box-shadow: 0 4px 12px rgba(16,185,129,0.15); display: flex; flex-direction: column; align-items: flex-end; z-index: 30;">
                            <span style="font-size: 0.65rem; font-weight: 800; color: #059669; text-transform: uppercase; letter-spacing: 0.5px;">ESTIMATED PRICE</span>
                            <span style="font-size: 1.45rem; font-weight: 900; color: #047857; line-height: 1.1;">${currency} ${Math.round(grandTotal).toLocaleString('en-IN')}</span>
                        </div>

                    </div>
                </div>

                <!-- 3. MATERIAL BREAKDOWN & PRICING (2-Box Interface matching Initial / Studio Design) -->
                <div style="display: grid; grid-template-columns: 1.6fr 1.1fr; gap: 1.5rem; align-items: start; margin-top: 15px;">
                    
                    <!-- Left: Material Breakdown Table -->
                    <div class="glass-panel" style="padding: 1.5rem; border-radius: var(--radius-lg, 12px); background: #111827; border: 1px solid #1f2937; box-shadow: 0 4px 16px rgba(0,0,0,0.25);">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.1rem; border-bottom: 1px solid #1f2937; padding-bottom: 0.6rem;">
                            <div style="display: flex; align-items: center; gap: 0.5rem;">
                                <i data-lucide="layers" style="width: 18px; height: 18px; color: #38bdf8;"></i>
                                <h3 style="margin: 0; font-size: 0.95rem; font-weight: 800; color: #ffffff; text-transform: uppercase; letter-spacing: 0.5px;">WINDOW W${g.cols} MATERIAL BREAKDOWN</h3>
                            </div>
                            <span style="font-size: 0.72rem; color: #94a3b8; font-weight: 600;">1 unit BOM</span>
                        </div>

                        <div style="overflow-x: auto;">
                            <table style="width: 100%; border-collapse: collapse; font-size: 0.84rem;">
                                <thead>
                                    <tr style="border-bottom: 1.5px solid #1f2937; color: #94a3b8; text-align: left; font-size: 0.72rem; text-transform: uppercase;">
                                        <th style="padding: 0.5rem 0.6rem;">MATERIAL</th>
                                        <th style="padding: 0.5rem 0.6rem;">SPEC / LENGTH</th>
                                        <th style="padding: 0.5rem 0.6rem; text-align: right;">WEIGHT</th>
                                        <th style="padding: 0.5rem 0.6rem; text-align: right;">RATE</th>
                                        <th style="padding: 0.5rem 0.6rem; text-align: right;">SUBTOTAL</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.06);">
                                        <td style="padding: 0.65rem 0.6rem; font-weight: 700; color: #ffffff;">Profile</td>
                                        <td style="padding: 0.65rem 0.6rem; color: #94a3b8; font-size: 0.78rem;">${frameItem.name}</td>
                                        <td style="padding: 0.65rem 0.6rem; text-align: right; font-weight: 700; color: #38bdf8;">${frameWeightKg > 0 ? frameWeightKg.toFixed(2) + ' Kg' : '-'}</td>
                                        <td style="padding: 0.65rem 0.6rem; text-align: right; color: #cbd5e1;">${frameItem.isNone ? '-' : `${currency}${frameItem.rate}`}</td>
                                        <td style="padding: 0.65rem 0.6rem; text-align: right; font-weight: 800; color: #ffffff;">${currency}${Math.round(frameSubtotal).toLocaleString('en-IN')}</td>
                                    </tr>
                                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.06);">
                                        <td style="padding: 0.65rem 0.6rem; font-weight: 700; color: #ffffff;">Pipe</td>
                                        <td style="padding: 0.65rem 0.6rem; color: #94a3b8; font-size: 0.78rem;">${pipeItem.name}</td>
                                        <td style="padding: 0.65rem 0.6rem; text-align: right; font-weight: 700; color: #06b6d4;">${pipeWeightKg > 0 ? pipeWeightKg.toFixed(2) + ' Kg' : '-'}</td>
                                        <td style="padding: 0.65rem 0.6rem; text-align: right; color: #cbd5e1;">${pipeItem.isNone ? '-' : `${currency}${pipeItem.rate}`}</td>
                                        <td style="padding: 0.65rem 0.6rem; text-align: right; font-weight: 800; color: #ffffff;">${currency}${Math.round(pipeSubtotal).toLocaleString('en-IN')}</td>
                                    </tr>
                                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.06);">
                                        <td style="padding: 0.65rem 0.6rem; font-weight: 700; color: #ffffff;">Panel</td>
                                        <td style="padding: 0.65rem 0.6rem; color: #94a3b8; font-size: 0.78rem;">${panelItem.name}</td>
                                        <td style="padding: 0.65rem 0.6rem; text-align: right; font-weight: 700; color: #a855f7;">${panelWeightKg > 0 ? panelWeightKg.toFixed(2) + ' Kg' : '-'}</td>
                                        <td style="padding: 0.65rem 0.6rem; text-align: right; color: #cbd5e1;">${panelItem.isNone ? '-' : `${currency}${panelItem.rate}`}</td>
                                        <td style="padding: 0.65rem 0.6rem; text-align: right; font-weight: 800; color: #ffffff;">${currency}${Math.round(panelSubtotal).toLocaleString('en-IN')}</td>
                                    </tr>
                                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.06);">
                                        <td style="padding: 0.65rem 0.6rem; font-weight: 700; color: #ffffff;">Hinges</td>
                                        <td style="padding: 0.65rem 0.6rem; color: #94a3b8; font-size: 0.78rem;">${hingeItem.name}${hingeItem.isNone ? ' (0 nos)' : ` (${hingeQty} nos)`}</td>
                                        <td style="padding: 0.65rem 0.6rem; text-align: right; font-weight: 700; color: #f59e0b;">${hingeWeightKg > 0 ? hingeWeightKg.toFixed(2) + ' Kg' : '-'}</td>
                                        <td style="padding: 0.65rem 0.6rem; text-align: right; color: #cbd5e1;">${hingeItem.isNone ? '-' : `${currency}${hingeItem.rate}`}</td>
                                        <td style="padding: 0.65rem 0.6rem; text-align: right; font-weight: 800; color: #ffffff;">${currency}${Math.round(hingeSubtotal).toLocaleString('en-IN')}</td>
                                    </tr>
                                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.06);">
                                        <td style="padding: 0.65rem 0.6rem; font-weight: 700; color: #ffffff;">Paint</td>
                                        <td style="padding: 0.65rem 0.6rem; color: #94a3b8; font-size: 0.78rem;">${paintItem.name}</td>
                                        <td style="padding: 0.65rem 0.6rem; text-align: right; font-weight: 700; color: #ec4899;">-</td>
                                        <td style="padding: 0.65rem 0.6rem; text-align: right; color: #cbd5e1;">${paintItem.isNone ? '-' : `${currency}${paintItem.rate}`}</td>
                                        <td style="padding: 0.65rem 0.6rem; text-align: right; font-weight: 800; color: #ffffff;">${currency}${Math.round(paintSubtotal).toLocaleString('en-IN')}</td>
                                    </tr>
                                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.06);">
                                        <td style="padding: 0.65rem 0.6rem; font-weight: 700; color: #ffffff;">Hook & Rubber</td>
                                        <td style="padding: 0.65rem 0.6rem; color: #94a3b8; font-size: 0.78rem;">${hookItem.name}${hookItem.isNone ? ' (0 nos)' : ` (${hookQty} nos)`}</td>
                                        <td style="padding: 0.65rem 0.6rem; text-align: right; font-weight: 700; color: #10b981;">${hookWeightKg > 0 ? hookWeightKg.toFixed(2) + ' Kg' : '-'}</td>
                                        <td style="padding: 0.65rem 0.6rem; text-align: right; color: #cbd5e1;">${hookItem.isNone ? '-' : `${currency}${hookItem.rate}`}</td>
                                        <td style="padding: 0.65rem 0.6rem; text-align: right; font-weight: 800; color: #ffffff;">${currency}${Math.round(hookSubtotal).toLocaleString('en-IN')}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 0.65rem 0.6rem; font-weight: 700; color: #ffffff;">Lock & Accessories</td>
                                        <td style="padding: 0.65rem 0.6rem; color: #94a3b8; font-size: 0.78rem;">${lockItem.name}${lockItem.isNone ? ' (0 nos)' : ` (${lockQty} nos)`}</td>
                                        <td style="padding: 0.65rem 0.6rem; text-align: right; font-weight: 700; color: #ef4444;">${lockWeightKg > 0 ? lockWeightKg.toFixed(2) + ' Kg' : '-'}</td>
                                        <td style="padding: 0.65rem 0.6rem; text-align: right; color: #cbd5e1;">${lockItem.isNone ? '-' : `${currency}${lockItem.rate}`}</td>
                                        <td style="padding: 0.65rem 0.6rem; text-align: right; font-weight: 800; color: #ffffff;">${currency}${Math.round(lockSubtotal).toLocaleString('en-IN')}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- Right: Summary & Unit Price Card -->
                    <div class="glass-panel" style="padding: 1.5rem; border-radius: var(--radius-lg, 12px); background: #111827; border: 1px solid #1f2937; display: flex; flex-direction: column; gap: 1rem; box-shadow: 0 4px 16px rgba(0,0,0,0.25);">
                        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #1f2937; padding-bottom: 0.6rem;">
                            <h3 style="margin: 0; font-size: 0.95rem; font-weight: 800; color: #ffffff; text-transform: uppercase; letter-spacing: 0.5px;">WINDOW W${g.cols} PRICE</h3>
                            <span style="font-size: 0.72rem; color: #10b981; font-weight: 700;">1 Piece Calculation</span>
                        </div>

                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.8rem 1rem; background: #0b0f19; border-radius: 8px; border: 1px solid #1f2937;">
                            <span style="font-size: 0.82rem; font-weight: 700; color: #ffffff;">Material Cost</span>
                            <span style="font-size: 1.15rem; font-weight: 800; color: #ffffff;">${currency} ${Math.round(totalMaterialCost).toLocaleString('en-IN')}</span>
                        </div>

                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.8rem 1rem; background: #0b0f19; border-radius: 8px; border: 1px solid #1f2937;">
                            <span style="font-size: 0.82rem; font-weight: 700; color: #ffffff;">Labor Charges</span>
                            <div style="display: flex; align-items: center; gap: 6px;">
                                <span style="font-size: 0.85rem; font-weight: 700; color: #94a3b8;">${currency}</span>
                                <input type="number" step="50" min="0" value="${laborCharges}" onchange="window.updateGrid('laborCharge', this.value)" style="width: 84px; text-align: right; padding: 4px 8px; font-weight: 800; font-size: 0.95rem; border-radius: 5px; border: 1px solid #374151; background: #1f2937; color: #ffffff; outline: none;">
                            </div>
                        </div>

                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.8rem 1rem; background: #0b0f19; border-radius: 8px; border: 1px solid #1f2937;">
                            <span style="font-size: 0.82rem; font-weight: 700; color: #ffffff;">Margin / Profit %</span>
                            <div style="display: flex; align-items: center; gap: 6px;">
                                <input type="number" step="1" min="0" max="100" value="${profitMarginPercent}" onchange="window.updateGrid('profitMarginPercent', this.value)" style="width: 64px; text-align: right; padding: 4px 8px; font-weight: 800; font-size: 0.95rem; border-radius: 5px; border: 1px solid #374151; background: #1f2937; color: #10b981; outline: none;">
                                <span style="font-size: 0.85rem; font-weight: 800; color: #94a3b8;">%</span>
                            </div>
                        </div>

                        <!-- Single Unit Grand Total Card -->
                        <div style="padding: 1.25rem 1rem; background: rgba(16, 185, 129, 0.08); border: 2px solid rgba(16, 185, 129, 0.45); border-radius: 10px; text-align: center;">
                            <div style="font-size: 0.72rem; font-weight: 800; color: #10b981; text-transform: uppercase; letter-spacing: 0.5px;">WINDOW W${g.cols} UNIT PRICE</div>
                            <div style="font-size: 2.2rem; font-weight: 900; color: #ffffff; margin: 4px 0; line-height: 1;">
                                ${currency}${Math.round(grandTotal).toLocaleString('en-IN')}
                            </div>
                            <div style="font-size: 0.78rem; color: #94a3b8; font-weight: 600;">
                                ${currency} ${Math.round(grandTotal / areaSqFt).toLocaleString('en-IN')} / sq.ft
                            </div>
                        </div>

                    </div>

                </div>

            </div>
        `;
    } catch (err) {
        console.error("Render Error:", err);
        return `<div style="padding: 2rem; color: red;">Error rendering calculator: ${err.message}<br><small>${err.stack}</small></div>`;
    }
}


// Launch or Resume Quotation Studio
window.startQuotationStudio = (customerData) => {
    const defUnit = Store.state.settings?.preferences?.unit || 'cm';
    const defQuoteNum = Store.generateNextQuotationNumber ? Store.generateNextQuotationNumber(false) : `Q-${new Date().getFullYear()}-${String((Store.state.quotations?.length || 0) + 1).padStart(3, '0')}`;
    const defTitle = Store.state.settings?.quotationDefaults?.title || 'Quotation / Estimate';
    Store.state.quoteStudio = {
        active: true,
        step: customerData ? 'canvas' : 'customer_setup', // 'customer_setup' or 'canvas'
        quotationNumber: defQuoteNum,
        quotationTitle: defTitle,
        customer: customerData || {
            name: '',
            place: '',
            city: '',
            pincode: '',
            mobile: ''
        },
        materials: {
            frame: 'prof_box',
            pipe: 'tube_sq_1x1',
            panel: 'glass_5mm_clear',
            hinge: 'hinge_ss_4in',
            lock: 'lock_cockspur',
            hook: 'hook_stay_8in',
            paint: 'paint_epoxy_black'
        },
        items: [],
        currentWindow: {
            cols: 1, // ALWAYS START ON 1 KALLI
            rows: 1,
            unit: defUnit,
            totalW: convertUnit(50, 'cm', defUnit),
            totalH: convertUnit(140, 'cm', defUnit),
            paneWidths: [convertUnit(50, 'cm', defUnit)],
            panePartitions: [0],
            partitionPos: ['top'],
            quantity: 1,
            laborCharge: 800,
            profitMarginPercent: 15
        }
    };
    Store.state.calcTab = 'quotes';
    Store.state.currentView = 'calculation';
    Store.notify();
};

window.cancelQuotationStudio = () => {
    if (Store.state.quoteStudio?.items?.length > 0) {
        if (!confirm('Discard active quotation draft and return to Quick Calculation?')) return;
    }
    Store.state.quoteStudio = null;
    Store.state.calcTab = 'manual';
    Store.notify();
};

window.autofillQuoteCustomer = (custId) => {
    if (!custId || !Store.state.quoteStudio) return;
    const c = (Store.state.customers || []).find(cust => cust.id === custId);
    if (!c) return;
    const custState = Store.state.quoteStudio.customer;
    custState.name = c.name || '';
    custState.mobile = c.mobile || '';
    custState.place = c.place || c.address?.split(',')[0] || '';
    custState.city = c.city || (c.address?.includes(',') ? c.address.split(',')[1].trim() : '') || 'Kozhikode';
    custState.pincode = c.pincode || '673001';
    
    // Update inputs directly if in DOM
    const nameInput = document.getElementById('qs-cust-name');
    const placeInput = document.getElementById('qs-cust-place');
    const cityInput = document.getElementById('qs-cust-city');
    const pinInput = document.getElementById('qs-cust-pin');
    const mobInput = document.getElementById('qs-cust-mobile');
    if (nameInput) nameInput.value = custState.name;
    if (placeInput) placeInput.value = custState.place;
    if (cityInput) cityInput.value = custState.city;
    if (pinInput) pinInput.value = custState.pincode;
    if (mobInput) mobInput.value = custState.mobile;
};

// Wizard Step 1 & 2 validation -> Proceed to 2D Canvas Studio
window.proceedToQuotationCanvas = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!Store.state.quoteStudio) return;
    const cust = Store.state.quoteStudio.customer;

    cust.name = (document.getElementById('qs-cust-name')?.value || cust.name || '').trim();
    cust.place = (document.getElementById('qs-cust-place')?.value || cust.place || '').trim();
    cust.city = (document.getElementById('qs-cust-city')?.value || cust.city || '').trim();
    cust.pincode = (document.getElementById('qs-cust-pin')?.value || cust.pincode || '').trim();
    cust.mobile = (document.getElementById('qs-cust-mobile')?.value || cust.mobile || '').trim();

    // Quotation Number & Title Overrides
    const customNum = document.getElementById('qs-quote-number')?.value?.trim();
    if (customNum) Store.state.quoteStudio.quotationNumber = customNum;
    const customTitle = document.getElementById('qs-quote-title')?.value?.trim();
    if (customTitle) Store.state.quoteStudio.quotationTitle = customTitle;

    // 5 Mandatory Fields Validation
    if (!cust.name) { alert('Please enter Customer Name.'); return; }
    if (!cust.place) { alert('Please enter Place.'); return; }
    if (!cust.city) { alert('Please enter City.'); return; }
    if (!cust.pincode) { alert('Please enter Pincode.'); return; }
    if (!cust.mobile) { alert('Please enter Mobile Number.'); return; }

    // Save selected default materials
    const mats = Store.state.quoteStudio.materials;
    mats.frame = document.getElementById('qs-mat-frame')?.value || mats.frame;
    mats.pipe = document.getElementById('qs-mat-pipe')?.value || mats.pipe;
    mats.panel = document.getElementById('qs-mat-panel')?.value || mats.panel;
    mats.hinge = document.getElementById('qs-mat-hinge')?.value || mats.hinge;
    mats.lock = document.getElementById('qs-mat-lock')?.value || mats.lock;
    mats.hook = document.getElementById('qs-mat-hook')?.value || mats.hook;
    mats.paint = document.getElementById('qs-mat-paint')?.value || mats.paint;

    Store.state.quoteStudio.step = 'canvas';
    Store.notify();
};

// Studio Canvas Handlers
window.updateStudioGrid = (key, val) => {
    if (Store.state.quoteStudio) Store.state.quoteStudio.currentWindowSaved = false;
    if (!Store.state.quoteStudio?.currentWindow) return;
    const cw = Store.state.quoteStudio.currentWindow;
    if (key.startsWith('mat_')) {
        const matKey = key.split('_')[1];
        Store.state.quoteStudio.materials[matKey] = val;
    } else if (key === 'cols') {
        const newCols = Math.max(1, parseInt(val) || 1);
        cw.cols = newCols;
        const defaultW = parseFloat((cw.totalW / newCols).toFixed(1));
        cw.paneWidths = Array(newCols).fill(defaultW);
        cw.panePartitions = Array(newCols).fill(0);
        cw.partitionPos = Array(newCols).fill('top');
    } else if (key === 'totalW') {
        const newTotal = parseFloat(val) || 0;
        const oldTotal = cw.totalW || 1;
        cw.totalW = newTotal;
        if (cw.paneWidths && cw.paneWidths.length === cw.cols && oldTotal > 0) {
            cw.paneWidths = cw.paneWidths.map(pw => parseFloat(((pw / oldTotal) * newTotal).toFixed(1)));
        }
    } else if (key === 'totalH') {
        cw.totalH = parseFloat(val) || 0;
    } else if (key === 'laborCharge') {
        cw.laborCharge = parseFloat(val) || 0;
    } else if (key === 'profitMarginPercent') {
        cw.profitMarginPercent = parseFloat(val) || 0;
    }
    Store.notify();
};

window.loadStudioPreset = (cols) => {
    if (Store.state.quoteStudio) Store.state.quoteStudio.currentWindowSaved = false;
    if (!Store.state.quoteStudio?.currentWindow) return;
    const cw = Store.state.quoteStudio.currentWindow;
    const newCols = Math.max(1, parseInt(cols) || 1);
    cw.cols = newCols;
    const widthCm = newCols * 50;
    cw.totalW = convertUnit(widthCm, 'cm', cw.unit);
    cw.totalH = convertUnit(140, 'cm', cw.unit);
    const paneWInUnit = convertUnit(50, 'cm', cw.unit);
    cw.paneWidths = Array(newCols).fill(paneWInUnit);
    cw.panePartitions = Array(newCols).fill(0);
    cw.partitionPos = Array(newCols).fill('top');
    Store.notify();
};

window.toggleStudioUnit = (newUnit) => {
    if (!Store.state.quoteStudio?.currentWindow) return;
    const cw = Store.state.quoteStudio.currentWindow;
    if (newUnit === cw.unit) return;
    const oldUnit = cw.unit;
    cw.totalW = convertUnit(cw.totalW, oldUnit, newUnit);
    cw.totalH = convertUnit(cw.totalH, oldUnit, newUnit);
    if (cw.paneWidths && cw.paneWidths.length) {
        cw.paneWidths = cw.paneWidths.map(w => convertUnit(w, oldUnit, newUnit));
    }
    cw.unit = newUnit;
    Store.notify();
};


window.selectStudioPane = (idx) => {
    if (!Store.state.quoteStudio?.currentWindow) return;
    const cw = Store.state.quoteStudio.currentWindow;
    if (idx >= 0 && idx < cw.cols) {
        cw.activePaneIndex = idx;
        Store.notify();
    }
};

window.setStudioPanePartitionCount = (idx, count) => {
    if (!Store.state.quoteStudio?.currentWindow) return;
    const cw = Store.state.quoteStudio.currentWindow;
    if (!cw.panePartitions) cw.panePartitions = Array(cw.cols).fill(0);
    cw.activePaneIndex = idx;
    cw.panePartitions[idx] = Math.max(0, Math.min(10, parseInt(count) || 0));
    Store.notify();
};

window.setStudioPanePartitionPos = (idx, pos, dir = 'horizontal', count = null) => {
    if (!Store.state.quoteStudio?.currentWindow) return;
    const cw = Store.state.quoteStudio.currentWindow;
    if (!cw.partitionPos) cw.partitionPos = Array(cw.cols).fill('top');
    if (!cw.partitionDir) cw.partitionDir = Array(cw.cols).fill('horizontal');
    if (!cw.panePartitions) cw.panePartitions = Array(cw.cols).fill(0);
    cw.activePaneIndex = idx;
    if (count !== null && count !== undefined) {
        cw.panePartitions[idx] = Math.max(0, Math.min(10, parseInt(count) || 0));
    } else if ((cw.panePartitions[idx] || 0) === 0) {
        cw.panePartitions[idx] = 1;
    }
    if (dir) cw.partitionDir[idx] = dir;
    else if (pos === 'vertical') {
        cw.partitionDir[idx] = 'vertical';
        pos = 'center';
    }
    cw.partitionPos[idx] = pos;
    Store.notify();
};

window.cycleStudioPartitionPos = (idx) => {
    if (!Store.state.quoteStudio?.currentWindow) return;
    const cw = Store.state.quoteStudio.currentWindow;
    if (!cw.partitionPos) cw.partitionPos = Array(cw.cols).fill('top');
    cw.activePaneIndex = idx;
    const order = ['top', 'center', 'bottom'];
    const cur = cw.partitionPos[idx] || 'top';
    const nextIdx = (order.indexOf(cur) + 1) % order.length;
    cw.partitionPos[idx] = order[nextIdx];
    Store.notify();
};

window.cycleStudioPartition = (idx) => {
    if (!Store.state.quoteStudio?.currentWindow) return;
    const cw = Store.state.quoteStudio.currentWindow;
    if (!cw.panePartitions) cw.panePartitions = Array(cw.cols).fill(0);
    cw.activePaneIndex = idx;
    const cur = cw.panePartitions[idx] || 0;
    cw.panePartitions[idx] = (cur + 1) % 6;
    Store.notify();
};

window.updateStudioPaneWidth = (idx, val) => {
    if (!Store.state.quoteStudio?.currentWindow) return;
    const cw = Store.state.quoteStudio.currentWindow;
    let newVal = parseFloat(val) || 0;
    if (newVal <= 0) newVal = 10;
    cw.paneWidths[idx] = newVal;
    // Independent Pane Widths (Audio 2): All column widths add up without resetting other panes
    cw.totalW = parseFloat(cw.paneWidths.reduce((sum, w) => sum + (parseFloat(w) || 0), 0).toFixed(1));
    Store.notify();
};

window.updateStudioQty = (val) => {
    if (!Store.state.quoteStudio?.currentWindow) return;
    const qty = Math.max(1, parseInt(val) || 1);
    Store.state.quoteStudio.currentWindow.quantity = qty;
    const unitEl = document.getElementById('studio-unit-calc-text');
    const totalEl = document.getElementById('studio-total-calc-text');
    if (unitEl && totalEl && window._lastStudioUnitPrice) {
        const grandTotal = window._lastStudioUnitPrice;
        const cur = Store.state.settings?.preferences?.currency || '₹';
        unitEl.textContent = `Unit: ${cur}${Math.round(grandTotal).toLocaleString('en-IN')} × ${qty} nos`;
        totalEl.textContent = `Total: ${cur}${Math.round(grandTotal * qty).toLocaleString('en-IN')}`;
    }
};

// Non-blocking in-app notification toast (Replaces window.alert popup)
window.showStudioToast = (msg) => {
    let t = document.getElementById('studio-save-toast');
    if (!t) {
        t = document.createElement('div');
        t.id = 'studio-save-toast';
        t.style.cssText = `
            position: fixed;
            top: 24px;
            right: 24px;
            background: #0f172a;
            color: #ffffff;
            padding: 12px 22px;
            border-radius: 8px;
            border: 1.5px solid #10b981;
            box-shadow: 0 12px 32px rgba(0,0,0,0.35);
            z-index: 100099;
            font-size: 0.88rem;
            font-weight: 700;
            display: flex;
            align-items: center;
            gap: 12px;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            opacity: 0;
            transform: translateY(-20px);
            pointer-events: none;
        `;
        document.body.appendChild(t);
    }
    t.innerHTML = `
        <span style="display: flex; align-items: center; justify-content: center; width: 22px; height: 22px; border-radius: 50%; background: #10b981; color: white; font-size: 0.8rem; font-weight: 900;">✓</span>
        <span>${msg}</span>
    `;
    t.style.opacity = '1';
    t.style.transform = 'translateY(0)';
    clearTimeout(window._studioToastTimer);
    window._studioToastTimer = setTimeout(() => {
        if (t) {
            t.style.opacity = '0';
            t.style.transform = 'translateY(-20px)';
        }
    }, 3500);
};

// "Save & New" - Adds current window to quote draft items and advances to next window for same customer
window.saveQuotationItemAndNew = () => {
    if (!Store.state.quoteStudio?.currentWindow) return;
    const qs = Store.state.quoteStudio;
    const cw = qs.currentWindow;
    const itemNum = qs.items.length + 1;

    // Direct read from DOM elements in case onchange hasn't flushed yet
    const qtyInp = document.getElementById('studio-item-qty');
    const qty = Math.max(1, parseInt(qtyInp ? qtyInp.value : cw.quantity) || 1);
    cw.quantity = qty;

    const wInp = document.querySelector('input[onchange*="totalW"]');
    if (wInp && parseFloat(wInp.value) > 0) cw.totalW = parseFloat(wInp.value);

    const hInp = document.querySelector('input[onchange*="totalH"]');
    if (hInp && parseFloat(hInp.value) > 0) cw.totalH = parseFloat(hInp.value);

    // Calculate BOM and final unit price for current window
    const w_mm = convertUnit(cw.totalW, cw.unit, 'mm');
    const h_mm = convertUnit(cw.totalH, cw.unit, 'mm');
    const w_ft = (w_mm / 25.4) / 12;
    const h_ft = (h_mm / 25.4) / 12;
    const areaSqFt = Math.max(0.01, w_ft * h_ft);
    const perimeterFt = 2 * (w_ft + h_ft);

    const catalog = Store.state.materialCatalog || [];
    const getCat = (key) => {
        const id = qs.materials[key];
        if (id === 'none' || !id) return { isNone: true, name: 'None', rate: 0, weightFactor: 0 };
        return catalog.find(m => m.id === id || m.name === id) || { name: key, rate: 0, weightFactor: 0 };
    };

    const fItem = getCat('frame');
    const pItem = getCat('pipe');
    const panItem = getCat('panel');
    const hItem = getCat('hinge');
    const paintItem = getCat('paint');
    const hookItem = getCat('hook');
    const lockItem = getCat('lock');

    const fCost = fItem.isNone ? 0 : (perimeterFt * (fItem.weightFactor || 1.45) * (fItem.rate || 180));
    const pCost = pItem.isNone ? 0 : ((((cw.cols - 1) * h_ft) + ((cw.panePartitions || []).reduce((a,b)=>a+b,0) * (cw.totalW / cw.cols / 25.4 / 12))) * (pItem.weightFactor || 1.15) * (pItem.rate || 95));
    const panCost = panItem.isNone ? 0 : (areaSqFt * (panItem.rate || 55));
    const hCost = hItem.isNone ? 0 : (Math.max(2, cw.cols * 2) * (hItem.rate || 85));
    const paintCost = paintItem.isNone ? 0 : (Math.max(0.5, (perimeterFt * 0.45 / 12)) * (paintItem.rate || 480));
    const hookCost = hookItem.isNone ? 0 : (Math.max(1, Math.min(cw.cols, 2)) * (hookItem.rate || 75));
    const lockCost = lockItem.isNone ? 0 : (Math.max(1, Math.min(cw.cols, 2)) * (lockItem.rate || 160));

    const totalMat = fCost + pCost + panCost + hCost + paintCost + hookCost + lockCost;
    const base = totalMat + (cw.laborCharge || 800);
    const unitPrice = Math.round(base * (1 + ((cw.profitMarginPercent || 15) / 100)));
    const totalPrice = unitPrice * qty;

    const modelTitle = (cw.name && !cw.name.startsWith('Window W')) ? `${cw.name} (${cw.totalW}x${cw.totalH} ${cw.unit})` : `Window W${itemNum} (${cw.totalW}x${cw.totalH} ${cw.unit})`;
    const itemName = modelTitle;
    const itemDesc = `${cw.cols} Kalli (${cw.totalW}×${cw.totalH} ${cw.unit}) - ${fItem.name}`;

    const newItem = {
        id: 'W-' + Date.now() + '-' + itemNum,
        itemNumber: `Window W${itemNum}`,
        name: itemName,
        desc: itemDesc,
        modelTitle: modelTitle,
        cols: cw.cols,
        width: cw.totalW,
        height: cw.totalH,
        unit: cw.unit,
        paneWidths: [...(cw.paneWidths || Array(cw.cols).fill(cw.totalW / cw.cols))],
        panePartitions: [...(cw.panePartitions || Array(cw.cols).fill(0))],
        partitionPos: [...(cw.partitionPos || Array(cw.cols).fill('top'))],
        frame: qs.materials.frame,
        pipe: qs.materials.pipe,
        panel: qs.materials.panel,
        hinge: qs.materials.hinge,
        lock: qs.materials.lock,
        hook: qs.materials.hook,
        paint: qs.materials.paint,
        qty: qty,
        pieces: qty,
        rate: unitPrice,
        price: unitPrice,
        total: totalPrice,
        areaSqFt: areaSqFt.toFixed(2),
        bomSummary: `${fItem.name}, ${pItem.name}, ${panItem.name}`
    };
    newItem.drawingSvg = window.generateWindowCadSvg(newItem, { isThumbnail: true, showDimensions: true, viewW: 160, viewH: 120 });


    qs.items.push(newItem);
    qs.currentWindowSaved = true;

    // Reset current window for next window calculation (1 Kalli 50x140 cm default)
    const u = cw.unit || 'cm';
    qs.currentWindow = {
        cols: 1, // ALWAYS START ON 1 KALLI FOR NEXT WINDOW
        rows: 1,
        unit: u,
        totalW: convertUnit(50, 'cm', u),
        totalH: convertUnit(140, 'cm', u),
        paneWidths: [convertUnit(50, 'cm', u)],
        panePartitions: [0],
        partitionPos: ['top'],
        quantity: 1,
        laborCharge: 800,
        profitMarginPercent: 15
    };

    Store.notify();
    window.showStudioToast(`Window W${itemNum} saved (${qty} nos • ₹${totalPrice.toLocaleString('en-IN')})! Ready for Window W${itemNum + 1}`);
};

// "Save" - Finalizes quotation, creates customer if new, creates quotation in Store, and opens print modal
window.saveQuotationFinal = () => {
    if (!Store.state.quoteStudio) return;
    const qs = Store.state.quoteStudio;
    const cw = qs.currentWindow;

    // Direct read from DOM elements in case onchange hasn't flushed yet
    const qtyInp = document.getElementById('studio-item-qty');
    const qty = Math.max(1, parseInt(qtyInp ? qtyInp.value : cw.quantity) || 1);
    cw.quantity = qty;

    const wInp = document.querySelector('input[onchange*="totalW"]');
    if (wInp && parseFloat(wInp.value) > 0) cw.totalW = parseFloat(wInp.value);

    const hInp = document.querySelector('input[onchange*="totalH"]');
    if (hInp && parseFloat(hInp.value) > 0) cw.totalH = parseFloat(hInp.value);

    // If the active window has not been pushed yet, automatically save it as the final item
    if (!qs.currentWindowSaved && cw && cw.totalW > 0 && cw.totalH > 0) {
        const itemNum = qs.items.length + 1;

        const w_mm = convertUnit(cw.totalW, cw.unit, 'mm');
        const h_mm = convertUnit(cw.totalH, cw.unit, 'mm');
        const w_ft = (w_mm / 25.4) / 12;
        const h_ft = (h_mm / 25.4) / 12;
        const areaSqFt = Math.max(0.01, w_ft * h_ft);
        const perimeterFt = 2 * (w_ft + h_ft);

        const catalog = Store.state.materialCatalog || [];
        const getCat = (key) => {
            const id = qs.materials[key];
            if (id === 'none' || !id) return { isNone: true, name: 'None', rate: 0, weightFactor: 0 };
            return catalog.find(m => m.id === id || m.name === id) || { name: key, rate: 0, weightFactor: 0 };
        };

        const fItem = getCat('frame');
        const pItem = getCat('pipe');
        const panItem = getCat('panel');
        const hItem = getCat('hinge');
        const paintItem = getCat('paint');
        const hookItem = getCat('hook');
        const lockItem = getCat('lock');

        const fCost = fItem.isNone ? 0 : (perimeterFt * (fItem.weightFactor || 1.45) * (fItem.rate || 180));
        const pCost = pItem.isNone ? 0 : ((((cw.cols - 1) * h_ft) + ((cw.panePartitions || []).reduce((a,b)=>a+b,0) * (cw.totalW / cw.cols / 25.4 / 12))) * (pItem.weightFactor || 1.15) * (pItem.rate || 95));
        const panCost = panItem.isNone ? 0 : (areaSqFt * (panItem.rate || 55));
        const hCost = hItem.isNone ? 0 : (Math.max(2, cw.cols * 2) * (hItem.rate || 85));
        const paintCost = paintItem.isNone ? 0 : (Math.max(0.5, (perimeterFt * 0.45 / 12)) * (paintItem.rate || 480));
        const hookCost = hookItem.isNone ? 0 : (Math.max(1, Math.min(cw.cols, 2)) * (hookItem.rate || 75));
        const lockCost = lockItem.isNone ? 0 : (Math.max(1, Math.min(cw.cols, 2)) * (lockItem.rate || 160));

        const totalMat = fCost + pCost + panCost + hCost + paintCost + hookCost + lockCost;
        const base = totalMat + (cw.laborCharge || 800);
        const unitPrice = Math.round(base * (1 + ((cw.profitMarginPercent || 15) / 100)));
        const totalPrice = unitPrice * qty;

        const modelTitle = (cw.name && !cw.name.startsWith('Window W')) ? `${cw.name} (${cw.totalW}x${cw.totalH} ${cw.unit})` : `Window W${itemNum} (${cw.totalW}x${cw.totalH} ${cw.unit})`;
        const itemName = modelTitle;
        const itemDesc = `${cw.cols} Kalli (${cw.totalW}×${cw.totalH} ${cw.unit}) - ${fItem.name}`;

        const autoItem = {
            id: 'W-' + Date.now() + '-' + itemNum,
            itemNumber: `Window W${itemNum}`,
            name: itemName,
            desc: itemDesc,
            modelTitle: modelTitle,
            cols: cw.cols,
            width: cw.totalW,
            height: cw.totalH,
            unit: cw.unit,
            paneWidths: [...(cw.paneWidths || Array(cw.cols).fill(cw.totalW / cw.cols))],
            panePartitions: [...(cw.panePartitions || Array(cw.cols).fill(0))],
            partitionPos: [...(cw.partitionPos || Array(cw.cols).fill('top'))],
            frame: qs.materials.frame,
            pipe: qs.materials.pipe,
            panel: qs.materials.panel,
            hinge: qs.materials.hinge,
            lock: qs.materials.lock,
            hook: qs.materials.hook,
            paint: qs.materials.paint,
            qty: qty,
            pieces: qty,
            rate: unitPrice,
            price: unitPrice,
            total: totalPrice,
            areaSqFt: areaSqFt.toFixed(2),
            bomSummary: `${fItem.name}, ${pItem.name}, ${panItem.name}`
        };
        autoItem.drawingSvg = window.generateWindowCadSvg(autoItem, { isThumbnail: true, showDimensions: true, viewW: 160, viewH: 120 });
        qs.items.push(autoItem);

        qs.currentWindowSaved = true;
    }

    if (qs.items.length === 0) {
        alert('Please add at least one window item to save quotation.');
        return;
    }

    // 1. Ensure Customer exists in Store
    if (!Store.state.customers) Store.state.customers = [];
    let existingCust = Store.state.customers.find(c => 
        (c.mobile && c.mobile === qs.customer.mobile) || 
        (c.name && c.name.toLowerCase() === qs.customer.name.toLowerCase())
    );

    const formattedAddr = [qs.customer.place, qs.customer.city, qs.customer.pincode].filter(Boolean).join(', ');

    if (!existingCust) {
        existingCust = {
            id: 'C-' + String(Store.state.customers.length + 1).padStart(3, '0'),
            name: qs.customer.name,
            place: qs.customer.place || '',
            city: qs.customer.city || '',
            pincode: qs.customer.pincode || '',
            address: formattedAddr || qs.customer.name,
            mobile: qs.customer.mobile || '',
            orders: 1,
            totalValue: 0,
            advanceBalance: 0
        };
        Store.state.customers.push(existingCust);
    } else {
        existingCust.place = qs.customer.place || existingCust.place || '';
        existingCust.city = qs.customer.city || existingCust.city || '';
        existingCust.pincode = qs.customer.pincode || existingCust.pincode || '';
        if (formattedAddr) existingCust.address = formattedAddr;
    }

    // 2. Generate Official Quotation
    if (!Store.state.quotations) Store.state.quotations = [];
    const quoteTotal = qs.items.reduce((sum, it) => sum + (it.total || 0), 0);
    const quoteNum = qs.quotationNumber || (Store.generateNextQuotationNumber ? Store.generateNextQuotationNumber(true) : `Q-${new Date().getFullYear()}-${String(Store.state.quotations.length + 1).padStart(3, '0')}`);
    if (Store.generateNextQuotationNumber && quoteNum === Store.generateNextQuotationNumber(false)) {
        Store.generateNextQuotationNumber(true);
    }
    const quoteTitle = qs.quotationTitle || Store.state.settings?.quotationDefaults?.title || 'Quotation / Estimate';
    const quoteTerms = (qs.termsRows && qs.termsRows.length > 0)
        ? [...qs.termsRows]
        : (Store.state.settings?.quotationDefaults?.termsRows ? [...Store.state.settings.quotationDefaults.termsRows] : [
            '1. Rates are valid for 15 days from the date of quotation.',
            '2. 50% advance along with confirmed work order.',
            '3. Delivery within 10-14 working days after advance and dimension approval.',
            '4. Transport & installation extra as per actual site conditions.'
        ]);

    const newQuote = {
        id: quoteNum,
        title: quoteTitle,
        customer: existingCust.name,
        customerId: existingCust.id,
        customerPhone: existingCust.mobile || '',
        customerAddress: existingCust.address || formattedAddr || '',
        date: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        amount: quoteTotal,
        total: quoteTotal,
        status: 'Draft',
        description: `Custom steel windows quotation for ${existingCust.name} (${qs.items.length} window items)`,
        termsRows: quoteTerms,
        salesPerson: { name: Store.state.user?.name || 'Administrator', contact: Store.state.user?.phone || '9846123456' },
        items: qs.items.map(it => ({
            name: it.name,
            desc: it.desc,
            modelTitle: it.modelTitle || it.name,
            pieces: it.qty,
            qty: it.qty,
            rate: it.rate,
            price: it.price,
            total: it.total,
            uom: 'pcs',
            cols: it.cols,
            width: it.width,
            height: it.height,
            unit: it.unit,
            paneWidths: it.paneWidths,
            panePartitions: it.panePartitions,
            partitionPos: it.partitionPos,
            frame: it.frame,
            pipe: it.pipe,
            panel: it.panel,
            bomSummary: it.bomSummary,
            drawingSvg: it.drawingSvg || window.generateWindowCadSvg(it, { isThumbnail: true, showDimensions: true, viewW: 160, viewH: 120 })
        }))

    };

    Store.state.quotations.unshift(newQuote);
    Store.saveState();

    // Reset Studio State
    Store.state.quoteStudio = null;
    Store.notify();

    // Immediately trigger Print / View Modal
    setTimeout(() => {
        if (typeof window.openPrintQuotationModal === 'function') {
            window.openPrintQuotationModal(newQuote);
        } else {
            alert(`Quotation ${newQuote.id} created successfully! Total: ₹${quoteTotal.toLocaleString('en-IN')}`);
        }
    }, 100);
};

// Render Quotation Studio: Wizard (Step 1 & 2) OR 2D Interactive Canvas Studio
export function renderQuotationStudio(state) {
    const qs = Store.state.quoteStudio;
    if (!qs) return renderManualCalc(state);
    const catalog = Store.state.materialCatalog || [];
    const currency = Store.state.settings?.preferences?.currency || '₹';

    // ---------------------------------------------------------
    // STEP 1 & 2: Customer Details (5 Mandatory Fields) + Default Materials
    // ---------------------------------------------------------
    if (qs.step === 'customer_setup') {
        const cust = qs.customer || {};
        const mats = qs.materials || {};
        const customers = Store.state.customers || [];

        return `
            <div style="width: 100%; max-width: 1400px; margin: 0 auto; font-family: var(--font-main, sans-serif);">
                <div class="glass-panel" style="padding: 1.5rem 1.75rem; background: var(--color-bg-card); border-radius: 12px; border: 1px solid var(--glass-border); box-shadow: 0 10px 40px rgba(0,0,0,0.25); width: 100%;">
                    
                    <form onsubmit="window.proceedToQuotationCanvas(event)" style="display: flex; flex-direction: column; gap: 1rem;">
                        
                        <!-- STEP 1: CUSTOMER DETAILS (5 MANDATORY FIELDS) -->
                        <div style="background: var(--color-bg-main); border: 1px solid var(--glass-border); border-radius: 10px; padding: 1.15rem 1.35rem;">
                            <!-- Quotation Number and Title Override -->
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px; background: rgba(56, 189, 248, 0.05); border: 1px solid rgba(56, 189, 248, 0.2); padding: 10px 12px; border-radius: 6px;">
                                <div>
                                    <label style="display: block; font-size: 0.78rem; font-weight: 700; color: var(--color-primary); margin-bottom: 4px;">
                                        Quotation Number <span style="font-weight: 500; font-size: 0.72rem; color: var(--color-text-muted);">(Editable Override)</span>
                                    </label>
                                    <input 
                                        type="text" 
                                        id="qs-quote-number" 
                                        value="${qs.quotationNumber || (Store.generateNextQuotationNumber ? Store.generateNextQuotationNumber(false) : 'Q-2026-001')}" 
                                        placeholder="e.g. Q-2026-001" 
                                        class="glass-input" 
                                        style="width: 100%; height: 38px; font-size: 0.92rem; font-weight: 700; padding: 6px 12px; color: #0284c7 !important; background: #ffffff !important; border-radius: 6px; font-family: monospace;"
                                    >
                                </div>
                                <div>
                                    <label style="display: block; font-size: 0.78rem; font-weight: 700; color: var(--color-primary); margin-bottom: 4px;">
                                        Quotation Title <span style="font-weight: 500; font-size: 0.72rem; color: var(--color-text-muted);">(Editable Override)</span>
                                    </label>
                                    <input 
                                        type="text" 
                                        id="qs-quote-title" 
                                        value="${qs.quotationTitle || Store.state.settings?.quotationDefaults?.title || 'Quotation / Estimate'}" 
                                        placeholder="e.g. Quotation / Estimate" 
                                        class="glass-input" 
                                        style="width: 100%; height: 38px; font-size: 0.92rem; font-weight: 600; padding: 6px 12px; color: #0f172a !important; background: #ffffff !important; border-radius: 6px;"
                                    >
                                </div>
                            </div>

                            <div style="margin-bottom: 0.75rem;">
                                <span style="font-size: 0.86rem; font-weight: 800; color: var(--color-primary); text-transform: uppercase; letter-spacing: 0.5px;">
                                    Step 1: Customer Details (All 5 Fields Mandatory)
                                </span>
                            </div>

                            <!-- Row 1: 4:1 Ratio (Customer Name 4fr : Mobile Number 1fr) with Increased Input Height -->
                            <div style="display: grid; grid-template-columns: 4fr 1fr; gap: 14px; margin-bottom: 14px;">
                                <div style="position: relative;">
                                    <label style="display: block; font-size: 0.78rem; font-weight: 700; color: var(--color-text-heading); margin-bottom: 5px;">1. Customer Name *</label>
                                    <input 
                                        type="text" 
                                        id="qs-cust-name" 
                                        required 
                                        value="${cust.name || ''}" 
                                        placeholder="Full Name or Business Name" 
                                        class="glass-input" 
                                        autocomplete="off"
                                        onfocus="window.showQuoteCustDropdown(this.value)"
                                        oninput="window.handleQuoteCustInput(this.value)"
                                        onkeydown="window.handleQuoteCustKey(event)"
                                        style="width: 100%; height: 44px; font-size: 0.95rem; font-weight: 600; padding: 10px 14px; color: #0f172a !important; background: #ffffff !important; border-radius: 6px; box-shadow: inset 0 1px 2px rgba(0,0,0,0.04);"
                                    >
                                    <div 
                                        id="qs-cust-dropdown" 
                                        style="display: none; position: absolute; top: calc(100% + 4px); left: 0; right: 0; max-height: 240px; overflow-y: auto; background: #ffffff; border: 1.5px solid #0284c7; border-radius: 6px; box-shadow: 0 12px 28px rgba(15,23,42,0.2); z-index: 1000; text-align: left;"
                                    ></div>
                                </div>
                                <div>
                                    <label style="display: block; font-size: 0.78rem; font-weight: 700; color: var(--color-text-heading); margin-bottom: 5px;">5. Mobile Number *</label>
                                    <input 
                                        type="tel" 
                                        id="qs-cust-mobile" 
                                        required 
                                        value="${cust.mobile || ''}" 
                                        placeholder="10-digit mobile number" 
                                        class="glass-input" 
                                        style="width: 100%; height: 44px; font-size: 0.95rem; font-weight: 600; padding: 10px 14px; color: #0f172a !important; background: #ffffff !important; border-radius: 6px; box-shadow: inset 0 1px 2px rgba(0,0,0,0.04);"
                                    >
                                </div>
                            </div>

                            <!-- Row 2: Location & Address Fields with Increased Input Height -->
                            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px;">
                                <div>
                                    <label style="display: block; font-size: 0.78rem; font-weight: 700; color: var(--color-text-heading); margin-bottom: 5px;">2. Place *</label>
                                    <input 
                                        type="text" 
                                        id="qs-cust-place" 
                                        required 
                                        value="${cust.place || ''}" 
                                        placeholder="Area / Locality" 
                                        class="glass-input" 
                                        style="width: 100%; height: 44px; font-size: 0.92rem; padding: 10px 14px; color: #0f172a !important; background: #ffffff !important; border-radius: 6px; box-shadow: inset 0 1px 2px rgba(0,0,0,0.04);"
                                    >
                                </div>
                                <div>
                                    <label style="display: block; font-size: 0.78rem; font-weight: 700; color: var(--color-text-heading); margin-bottom: 5px;">3. City *</label>
                                    <input 
                                        type="text" 
                                        id="qs-cust-city" 
                                        required 
                                        value="${cust.city || ''}" 
                                        placeholder="City / Town" 
                                        class="glass-input" 
                                        style="width: 100%; height: 44px; font-size: 0.92rem; padding: 10px 14px; color: #0f172a !important; background: #ffffff !important; border-radius: 6px; box-shadow: inset 0 1px 2px rgba(0,0,0,0.04);"
                                    >
                                </div>
                                <div>
                                    <label style="display: block; font-size: 0.78rem; font-weight: 700; color: var(--color-text-heading); margin-bottom: 5px;">4. Pincode *</label>
                                    <input 
                                        type="text" 
                                        id="qs-cust-pin" 
                                        required 
                                        value="${cust.pincode || ''}" 
                                        placeholder="6-digit postal PIN" 
                                        class="glass-input" 
                                        style="width: 100%; height: 44px; font-size: 0.92rem; padding: 10px 14px; color: #0f172a !important; background: #ffffff !important; border-radius: 6px; box-shadow: inset 0 1px 2px rgba(0,0,0,0.04);"
                                    >
                                </div>
                            </div>
                        </div>

                        <!-- STEP 2: MATERIAL PRESETS DROPDOWNS -->
                        <div style="background: var(--color-bg-main); border: 1px solid var(--glass-border); border-radius: 10px; padding: 1.15rem 1.35rem;">
                            <div style="margin-bottom: 0.75rem;">
                                <span style="font-size: 0.86rem; font-weight: 800; color: var(--color-primary); text-transform: uppercase; letter-spacing: 0.5px;">
                                    Step 2: Quotation Material Presets
                                </span>
                                <div style="font-size: 0.76rem; color: var(--color-text-muted); margin-top: 3px;">
                                    Select default materials for this quotation. Includes '-- None (Not Included) --' option.
                                </div>
                            </div>

                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(135px, 1fr)); gap: 10px;">
                                ${[
                                    { key: 'frame', label: '1. Profile / Frame', cats: ['profile', 'frame', 'aluminum_profile', 'al_profile'] },
                                    { key: 'pipe', label: '2. Pipe', cats: ['pipe', 'tube'] },
                                    { key: 'panel', label: '3. Panel', cats: ['panel', 'sheet', 'glass', 'acp'] },
                                    { key: 'hinge', label: '4. Hinges', cats: ['hinge', 'hinges', 'hardware'] },
                                    { key: 'lock', label: '5. Lock & Accessories', cats: ['lock', 'accessories'] },
                                    { key: 'hook', label: '6. Hook & Rubber', cats: ['hook', 'rubber', 'handle'] },
                                    { key: 'paint', label: '7. Paint', cats: ['paint', 'coating'] }
                                ].map(cfg => {
                                    const items = catalog.filter(m => {
                                        const cat = (m.category || '').toLowerCase().trim();
                                        return cfg.cats.some(c => {
                                            const lc = c.toLowerCase().trim();
                                            return cat === lc || cat.includes(lc) || lc.includes(cat);
                                        });
                                    });
                                    const selectedId = mats[cfg.key] || 'none';

                                    return `
                                        <div style="display: flex; flex-direction: column; gap: 4px; min-width: 0;">
                                            <label style="display: block; font-size: 0.76rem; font-weight: 700; color: var(--color-text-heading); margin-bottom: 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${escapeHtmlAttr(cfg.label)}">
                                                ${cfg.label}
                                            </label>
                                            <select 
                                                id="qs-mat-${cfg.key}" 
                                                class="calc-mat-select glass-input"
                                                onchange="if(Store.state.quoteStudio?.materials){ Store.state.quoteStudio.materials['${cfg.key}'] = this.value; }"
                                                style="width: 100%; height: 42px; padding: 6px 8px; border: 1.5px solid #cbd5e1; background: #ffffff !important; color: #0f172a !important; border-radius: 6px; font-size: 0.82rem; font-weight: 600; outline: none; cursor: pointer;"
                                            >
                                                <option value="none" ${selectedId === 'none' ? 'selected' : ''}>-- None (Not Included) --</option>
                                                ${items.map(m => `
                                                    <option value="${escapeHtmlAttr(m.id)}" ${(selectedId === m.id || selectedId === m.name) ? 'selected' : ''}>${escapeHtmlAttr(m.name)}</option>
                                                `).join('')}
                                            </select>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        </div>

                        <!-- Wizard Footer Actions (Directly visible without scrolling) -->
                        <div style="display: flex; justify-content: flex-end; gap: 1rem; border-top: 1px solid var(--glass-border); padding-top: 0.85rem; margin-top: 0.25rem;">
                            <button type="button" class="btn btn-secondary" onclick="window.cancelQuotationStudio()" style="padding: 0.5rem 1.25rem; font-size: 0.85rem;">
                                Cancel
                            </button>
                            <button type="submit" id="qs-btn-proceed-canvas" class="btn btn-primary" style="padding: 0.5rem 1.6rem; font-weight: 800; font-size: 0.85rem; display: flex; align-items: center; gap: 6px;">
                                Next: Open Window Studio <i data-lucide="arrow-right" style="width: 15px; height: 15px;"></i>
                            </button>
                        </div>

                    </form>
                </div>
            </div>
        `;
    }

    // ---------------------------------------------------------
    // STEP 3: 2D CALCULATION CANVAS STUDIO (Exact same UI as Quick Calc + Client Banner + Quantity + Save/Save & New)
    // ---------------------------------------------------------
    const cust = qs.customer || {};
    const cw = qs.currentWindow || { cols: 1, totalW: 50, totalH: 140, unit: 'cm', paneWidths: [50], panePartitions: [0], partitionPos: ['top'], quantity: 1, laborCharge: 800, profitMarginPercent: 15 };
    const currentQty = Math.max(1, parseInt(cw.quantity) || 1);
    const draftItems = qs.items || [];
    const itemNum = draftItems.length + 1;

    // Normalization & Calculations
    const w_mm = convertUnit(cw.totalW, cw.unit, 'mm');
    const h_mm = convertUnit(cw.totalH, cw.unit, 'mm');
    const w_ft = (w_mm / 25.4) / 12;
    const h_ft = (h_mm / 25.4) / 12;
    const areaSqFt = Math.max(0.01, w_ft * h_ft);
    const outerPerimeterFt = 2 * (w_ft + h_ft);

    const getCatItem = (catKey, defaultId) => {
        const selId = qs.materials?.[catKey];
        if (selId === 'none' || selId === '' || selId === false) {
            return { id: 'none', name: 'None (Not Included)', rate: 0, weightFactor: 0, isNone: true };
        }
        const found = catalog.find(m => m.id === selId || m.name === selId);
        if (found) return found;
        return catalog.find(m => (m.category || '').toLowerCase() === catKey.toLowerCase()) ||
               { id: defaultId, name: 'Standard ' + catKey, rate: 0, weightFactor: 0 };
    };

    const frameItem = getCatItem('frame', 'prof_box');
    const pipeItem = getCatItem('pipe', 'tube_sq_1x1');
    const panelItem = getCatItem('panel', 'glass_5mm_clear');
    const hingeItem = getCatItem('hinge', 'hinge_ss_4in');
    const paintItem = getCatItem('paint', 'paint_epoxy_black');
    const hookItem = getCatItem('hook', 'hook_stay_8in');
    const lockItem = getCatItem('lock', 'lock_cockspur');

    // Material Costs
    const frameLenFt = frameItem.isNone ? 0 : outerPerimeterFt;
    const frameWeightKg = frameItem.isNone ? 0 : (frameLenFt * (frameItem.weightFactor || 1.45));
    const frameSubtotal = frameItem.isNone ? 0 : (frameWeightKg * (frameItem.rate || 180));

    let partitionLenFt = 0;
    let totalPartitionDividers = 0;
    if (!pipeItem.isNone) {
        for (let i = 0; i < cw.cols; i++) {
            const parts = cw.panePartitions?.[i] || 0;
            if (parts > 0) {
                totalPartitionDividers += parts;
                const pw_mm = convertUnit(cw.paneWidths?.[i] || 50, cw.unit, 'mm');
                partitionLenFt += parts * ((pw_mm / 25.4) / 12);
            }
        }
    }
    const pipeLenFt = pipeItem.isNone ? 0 : (((cw.cols - 1) * h_ft) + partitionLenFt);
    const pipeWeightKg = pipeItem.isNone ? 0 : (pipeLenFt * (pipeItem.weightFactor || 1.15));
    const pipeSubtotal = pipeItem.isNone ? 0 : (pipeWeightKg * (pipeItem.rate || 95));

    const panelAreaSqFt = panelItem.isNone ? 0 : areaSqFt;
    const panelWeightKg = panelItem.isNone ? 0 : (panelAreaSqFt * (panelItem.weightFactor || 1.15));
    const panelSubtotal = panelItem.isNone ? 0 : (panelAreaSqFt * (panelItem.rate || 55));

    const hingeQty = hingeItem.isNone ? 0 : Math.max(2, cw.cols * 2);
    const hingeWeightKg = hingeItem.isNone ? 0 : (hingeQty * (hingeItem.weightFactor || 0.18));
    const hingeSubtotal = hingeItem.isNone ? 0 : (hingeQty * (hingeItem.rate || 85));

    const surfaceAreaFt2 = paintItem.isNone ? 0 : ((frameLenFt + pipeLenFt) * 0.45);
    const paintLtr = paintItem.isNone ? 0 : Math.max(0.5, parseFloat((surfaceAreaFt2 / (paintItem.coverage || 12)).toFixed(2)));
    const paintSubtotal = paintItem.isNone ? 0 : (paintLtr * (paintItem.rate || 480));

    const hookQty = hookItem.isNone ? 0 : Math.max(1, Math.min(cw.cols, 2));
    const hookWeightKg = hookItem.isNone ? 0 : (hookQty * (hookItem.weightFactor || 0.20));
    const hookSubtotal = hookItem.isNone ? 0 : (hookQty * (hookItem.rate || 75));

    const lockQty = lockItem.isNone ? 0 : Math.max(1, Math.min(cw.cols, 2));
    const lockWeightKg = lockItem.isNone ? 0 : (lockQty * (lockItem.weightFactor || 0.25));
    const lockSubtotal = lockItem.isNone ? 0 : (lockQty * (lockItem.rate || 160));

    const totalMaterialCost = frameSubtotal + pipeSubtotal + panelSubtotal + hingeSubtotal + paintSubtotal + hookSubtotal + lockSubtotal;
    const laborCharges = parseFloat(cw.laborCharge ?? 800) || 0;
    const profitMarginPercent = parseFloat(cw.profitMarginPercent ?? 15) || 0;
    const baseCost = totalMaterialCost + laborCharges;
    const addedProfit = baseCost * (profitMarginPercent / 100);
    const grandTotal = baseCost + addedProfit;
    window._lastStudioUnitPrice = grandTotal;

    const generatedModelTitle = `WINDOW W${itemNum} (${cw.totalW}x${cw.totalH} ${cw.unit})`;

    // 2D Visualizer SVG
    const svgW = 820;
    const svgH = 370;
    const maxAvailW = svgW - 170;
    const maxAvailH = svgH - 75;

    const aspect = (w_mm > 0 && h_mm > 0) ? (w_mm / h_mm) : (cw.cols * 50 / 140);
    let drawW, drawH;
    if (aspect >= (maxAvailW / maxAvailH)) {
        drawW = maxAvailW;
        drawH = Math.max(120, drawW / aspect);
    } else {
        drawH = maxAvailH;
        drawW = Math.max(120, drawH * aspect);
    }

    const startX = 135 + ((maxAvailW - drawW) / 2);
    const startY = 20 + ((maxAvailH - drawH) / 2);

    const is4x3 = String(qs.materials?.frame || '').toLowerCase().includes('4x3') || String(frameItem.name || '').toLowerCase().includes('4x3');
    const frameThick = is4x3 ? Math.max(14, Math.round(drawH * 0.052)) : Math.max(9, Math.round(drawH * 0.038));
    const mullionThick = Math.max(6, Math.round(frameThick * 0.72));
    const sashThick = Math.max(5, Math.round(frameThick * 0.65));
    const sashGap = 1.5; // TIGHT REBATE CLEARANCE (adippichu - no over-gap)

    const hasPanel = qs.materials?.panel !== 'none' && qs.materials?.panel !== '' && !panelItem.isNone;
    const profileFill = '#4a4d52';
    const profileStroke = '#181a1b';
    const strokeW = 1.5;
    const glassFill = '#ffffff';

    let gridSvg = '';
    let paneOverlays = '';
    let currentX = startX + frameThick;
    const innerStartY = startY + frameThick;
    const innerH = drawH - (frameThick * 2);
    const totalInnerW = drawW - (frameThick * 2) - ((cw.cols - 1) * mullionThick);

    for (let i = 0; i < cw.cols; i++) {
        const paneFraction = (cw.paneWidths?.[i] && cw.totalW > 0) ? (cw.paneWidths[i] / cw.totalW) : (1 / cw.cols);
        const drawPaneW = Math.max(10, Math.round(totalInnerW * paneFraction));
        const parts = cw.panePartitions?.[i] || 0;
        const pos = (cw.partitionPos && cw.partitionPos[i]) || 'top';

        // Sub-sections in this pane (based on horizontal partition)
        const subSections = [];
        if (parts === 0) {
            subSections.push({ y: innerStartY, h: innerH });
        } else if (parts === 1) {
            let pyFraction = 0.35;
            if (pos === 'center') pyFraction = 0.50;
            else if (pos === 'bottom') pyFraction = 0.65;
            const h1 = Math.round((innerH - mullionThick) * pyFraction);
            const h2 = innerH - mullionThick - h1;
            subSections.push({ y: innerStartY, h: h1 });
            subSections.push({ y: innerStartY + h1 + mullionThick, h: h2 });
        } else {
            const hEach = Math.round((innerH - (parts * mullionThick)) / (parts + 1));
            for (let p = 0; p <= parts; p++) {
                subSections.push({ y: innerStartY + (p * (hEach + mullionThick)), h: hEach });
            }
        }

        // Render each sub-section as apertures cutout into the solid frame (unified group - no seam lines)
        for (let s = 0; s < subSections.length; s++) {
            const sec = subSections[s];
            if (hasPanel) {
                // Outer aperture rebate border (white hairline / rebate opening)
                gridSvg += `<rect x="${currentX}" y="${sec.y}" width="${drawPaneW}" height="${sec.h}" fill="#ffffff" stroke="${profileStroke}" stroke-width="${strokeW}" />`;
                const sX = currentX + sashGap;
                const sY = sec.y + sashGap;
                const sW = drawPaneW - (sashGap * 2);
                const sH = sec.h - (sashGap * 2);
                if (sW > sashThick * 2 && sH > sashThick * 2) {
                    gridSvg += `<rect x="${sX}" y="${sY}" width="${sW}" height="${sH}" fill="${profileFill}" stroke="${profileStroke}" stroke-width="${strokeW}" />`;
                    const gX = sX + sashThick;
                    const gY = sY + sashThick;
                    const gW = sW - (sashThick * 2);
                    const gH = sH - (sashThick * 2);
                    gridSvg += `<rect x="${gX}" y="${gY}" width="${gW}" height="${gH}" fill="${glassFill}" stroke="${profileStroke}" stroke-width="${strokeW * 0.8}" />`;
                }
            } else {
                gridSvg += `<rect x="${currentX}" y="${sec.y}" width="${drawPaneW}" height="${sec.h}" fill="${glassFill}" stroke="${profileStroke}" stroke-width="${strokeW}" />`;
            }
        }

        const isSelectedStudio = (cw.activePaneIndex === i);
        const posDisplayStudio = pos === 'center' ? 'MIDDLE' : (pos === 'bottom' ? 'BOTTOM' : 'TOP');

        paneOverlays += `
            <div class="pane-hover-cell ${isSelectedStudio ? 'is-selected' : ''}" id="studio-pane-hover-cell-${i}" style="position: absolute; left: ${currentX}px; top: ${innerStartY}px; width: ${drawPaneW}px; height: ${innerH}px; pointer-events: none;">
                <!-- Direct Pane Click Target in Studio -->
                <div 
                    onclick="window.selectStudioPane(${i}, true)"
                    title="Pane ${i + 1} of ${cw.cols} (Click to select & configure partition) • Shortcuts: P, PT, PM, PB"
                    style="position: absolute; left: 0; top: 0; width: ${drawPaneW}px; height: ${innerH}px; cursor: pointer; z-index: 15; pointer-events: auto; border-radius: 2px; transition: all 0.15s ease; ${isSelectedStudio ? 'box-shadow: inset 0 0 0 2.5px #10b981, inset 0 0 16px rgba(16, 185, 129, 0.22);' : ''}"
                    onmouseenter="if(!${isSelectedStudio}) this.style.backgroundColor='rgba(16, 185, 129, 0.08)'; const b = document.getElementById('studio-pane-part-badge-${i}'); if(b) b.style.opacity='1';"
                    onmouseleave="if(!${isSelectedStudio}) this.style.backgroundColor='transparent'; const b = document.getElementById('studio-pane-part-badge-${i}'); if(b && !${isSelectedStudio}) b.style.opacity='0';"
                ></div>

                <!-- Partition Reference Position Pill (Audio: Transparent glassmorphism, ultra-compact number + arrow only, hover-only) -->
                <div 
                    id="studio-pane-part-badge-${i}"
                    class="pane-partition-pill-badge ${isSelectedStudio ? 'is-selected' : ''}"
                    onclick="event.stopPropagation(); window.openPartitionPosDropdown(${i}, this)" 
                    title="Pane ${i + 1}: Click to choose partitions (0, 1, 2, 3, 4, 5)"
                    onmouseenter="this.style.opacity='1';"
                    onmouseleave="if(!${isSelectedStudio}) this.style.opacity='0';"
                    style="
                        position: absolute; 
                        left: 50%; 
                        top: 8px; 
                        transform: translateX(-50%); 
                        pointer-events: auto; 
                        z-index: 25;
                        background: ${parts === 0 ? 'rgba(255, 255, 255, 0.40)' : 'rgba(255, 255, 255, 0.55)'}; 
                        border: 1.5px ${parts === 0 ? 'dashed rgba(100, 116, 139, 0.45)' : 'solid rgba(22, 163, 74, 0.60)'}; 
                        backdrop-filter: blur(4px);
                        -webkit-backdrop-filter: blur(4px);
                        border-radius: 5px; 
                        padding: 2px 7px; 
                        display: inline-flex; 
                        align-items: center; 
                        justify-content: center;
                        gap: 3px;
                        cursor: pointer; 
                        box-shadow: 0 1px 3px rgba(0,0,0,0.08); 
                        user-select: none; 
                        opacity: ${isSelectedStudio ? '1' : '0'};
                        transition: opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1), transform 0.15s ease, background 0.15s ease;
                        ${isSelectedStudio ? 'outline: 2px solid #10b981; outline-offset: 1px;' : ''}
                    "
                    onmouseover="this.style.background='rgba(255, 255, 255, 0.90)'; this.style.borderColor='#16a34a'; this.style.transform='translateX(-50%) scale(1.06)';"
                    onmouseout="this.style.background='${parts === 0 ? 'rgba(255, 255, 255, 0.40)' : 'rgba(255, 255, 255, 0.55)'}'; this.style.borderColor='${parts === 0 ? 'rgba(100, 116, 139, 0.45)' : 'rgba(22, 163, 74, 0.60)'}'; this.style.transform='translateX(-50%) scale(1)';"
                >
                    <span style="font-size: 0.82rem; font-weight: 800; color: ${parts === 0 ? '#64748b' : '#15803d'}; line-height: 1;">${parts}</span>
                    <span style="font-size: 0.52rem; color: ${parts === 0 ? '#94a3b8' : '#15803d'}; line-height: 1; opacity: 0.85;">▼</span>
                </div>
            </div>

            <div style="position: absolute; left: ${currentX}px; top: ${startY + drawH + 8}px; width: ${drawPaneW}px; text-align: center; z-index: 20;">
                <div style="font-size: 0.65rem; color: #64748b; font-weight: 700; margin-bottom: 2px;">W(${cw.unit})</div>
                <input type="number" class="hide-spin" step="${cw.unit === 'mm' ? '10' : '0.5'}" min="1" value="${cw.paneWidths?.[i] || 50}" onchange="window.updateStudioPaneWidth(${i}, this.value)" style="width: 68px; height: 28px; text-align: center; font-weight: 700; font-size: 0.95rem; color: #0f172a; border: 1.5px solid #cbd5e1; border-radius: 5px; background: #ffffff; box-shadow: 0 1px 3px rgba(0,0,0,0.06); outline: none; padding: 2px 2px; box-sizing: border-box; -webkit-appearance: none; appearance: none; -moz-appearance: textfield; font-variant-numeric: tabular-nums;">
            </div>
        `;

        currentX += drawPaneW + (i < cw.cols - 1 ? mullionThick : 0);
    }

    // Material Dropdown Builder with '-- None (Not Included) --' (Native Select Options) for Quotation Studio Canvas
    const renderStudioMatCol = (catKey, label, allowedCats, currentVal) => {
        const items = catalog.filter(m => {
            const cat = (m.category || '').toLowerCase().trim();
            return allowedCats.some(c => {
                const lc = c.toLowerCase().trim();
                return cat === lc || cat.includes(lc) || lc.includes(cat);
            });
        });

        return `
            <div style="display: flex; flex-direction: column; gap: 4px; min-width: 0;">
                <label style="font-size: 0.72rem; font-weight: 700; color: #475569; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${escapeHtmlAttr(label)}">${label}</label>
                <select 
                    id="studio-mat-${catKey}" 
                    class="calc-mat-select" 
                    onchange="window.updateStudioGrid('mat_${catKey}', this.value)" 
                    style="width: 100%; height: 32px; padding: 4px 6px; border: 1.5px solid #cbd5e1; border-radius: 6px; font-size: 0.78rem; font-weight: 600; color: #0f172a; background: #ffffff; outline: none; cursor: pointer; text-overflow: ellipsis;"
                >
                    <option value="none" ${currentVal === 'none' ? 'selected' : ''}>-- None (Not Included) --</option>
                    ${items.map(m => `
                        <option value="${escapeHtmlAttr(m.id)}" ${(currentVal === m.id || currentVal === m.name) ? 'selected' : ''}>${escapeHtmlAttr(m.name)}</option>
                    `).join('')}
                </select>
            </div>
        `;
    };

    return `
        <style>
            .hide-spin::-webkit-inner-spin-button, .hide-spin::-webkit-outer-spin-button { -webkit-appearance: none !important; margin: 0 !important; display: none !important; }
            .hide-spin { -moz-appearance: textfield !important; }
        </style>
        <div class="quotation-studio-container" style="display: flex; flex-direction: column; gap: 1.25rem; font-family: var(--font-main, sans-serif); max-width: 1400px; margin: 0 auto;">
            
            <!-- 1. TOP CLIENT DETAILS BANNER (Customer Name, Mobile, Place, City, Pincode) -->
            <div style="background: linear-gradient(135deg, #1e293b, #0f172a); border: 1px solid #334155; border-radius: 10px; padding: 14px 22px; color: white; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px; box-shadow: 0 4px 16px rgba(0,0,0,0.25);">
                <div style="display: flex; align-items: center; gap: 20px; flex-wrap: wrap;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div style="width: 38px; height: 38px; border-radius: 50%; background: #0284c7; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 1.1rem; color: white;">
                            ${(cust.name || 'C').charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <div style="font-size: 0.7rem; color: #94a3b8; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">QUOTATION CLIENT</div>
                            <div style="font-size: 1.15rem; font-weight: 800; color: #ffffff;">${cust.name || 'Customer'}</div>
                        </div>
                    </div>

                    <div style="border-left: 1px solid #334155; padding-left: 16px;">
                        <div style="font-size: 0.7rem; color: #94a3b8; font-weight: 700; text-transform: uppercase;">CONTACT</div>
                        <div style="font-size: 0.92rem; font-weight: 700; color: #38bdf8;">📞 ${cust.mobile || '-'}</div>
                    </div>

                    <div style="border-left: 1px solid #334155; padding-left: 16px;">
                        <div style="font-size: 0.7rem; color: #94a3b8; font-weight: 700; text-transform: uppercase;">LOCATION</div>
                        <div style="font-size: 0.88rem; font-weight: 600; color: #cbd5e1;">📍 ${cust.place || ''}, ${cust.city || ''} - ${cust.pincode || ''}</div>
                    </div>
                </div>

                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="text-align: right;">
                        <div style="font-size: 0.7rem; color: #94a3b8; font-weight: 700; text-transform: uppercase;">CURRENT DESIGN</div>
                        <div style="font-size: 1.1rem; font-weight: 800; color: #10b981;">Window W${itemNum}</div>
                    </div>
                    <button 
                        type="button" 
                        onclick="Store.state.quoteStudio.step = 'customer_setup'; Store.notify();" 
                        class="btn btn-secondary" 
                        style="font-size: 0.78rem; padding: 6px 12px; background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.2); color: white;"
                    >
                        Edit Client
                    </button>
                </div>
            </div>

            <!-- 2. TOP CONTROL BAR (MATCHING QUICK CALCULATION MODEL & 3-ROW LAYOUT) -->
            <div style="background: white; border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px 20px; box-shadow: 0 2px 6px rgba(0,0,0,0.04); display: flex; flex-direction: column; gap: 12px;">
                
                <!-- Top Row: Status Dot on Left, Design Model & Unit Dropdown on TOP RIGHT -->
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px dashed #e2e8f0; padding-bottom: 10px; flex-wrap: wrap; gap: 10px;">
                    
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: #10b981; box-shadow: 0 0 8px #10b981;"></span>
                        <span style="font-size: 0.85rem; font-weight: 800; color: #1e293b; text-transform: uppercase; letter-spacing: 0.5px;">Window Studio Estimator</span>
                    </div>

                    <!-- TOP RIGHT: DESIGN MODEL & UNIT SELECT -->
                    <div style="display: flex; align-items: center; gap: 16px; margin-left: auto;">
                        <div style="text-align: right;">
                            <div style="font-size: 0.68rem; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">DESIGN MODEL</div>
                            <div style="font-size: 1.15rem; font-weight: 800; color: #0284c7; margin-top: 1px;">${generatedModelTitle}</div>
                        </div>

                        <!-- Unit Dropdown (Select) -->
                        <div style="display: flex; align-items: center; gap: 6px; background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 6px; padding: 4px 8px;">
                            <span style="font-size: 0.72rem; color: #64748b; font-weight: 700;">UNIT:</span>
                            <select 
                                id="studio-unit-select" 
                                onchange="window.toggleStudioUnit(this.value)" 
                                style="border: none; background: transparent; font-size: 0.85rem; font-weight: 800; color: #0f172a; outline: none; cursor: pointer; text-transform: uppercase;"
                            >
                                <option value="cm" ${cw.unit === 'cm' ? 'selected' : ''}>CM</option>
                                <option value="mm" ${cw.unit === 'mm' ? 'selected' : ''}>MM</option>
                                <option value="inch" ${cw.unit === 'inch' ? 'selected' : ''}>INCH</option>
                                <option value="ft" ${cw.unit === 'ft' ? 'selected' : ''}>FT</option>
                                <option value="m" ${cw.unit === 'm' ? 'selected' : ''}>M</option>
                            </select>
                        </div>
                    </div>

                </div>

                <!-- Middle Row: 7 Material Columns Grid on a Single Sleek Row ('3. Panel' strictly) -->
                <div style="display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 8px; align-items: flex-end;">
                    ${renderStudioMatCol('frame', '1. Profile', ['profile', 'frame', 'aluminum_profile', 'al_profile'], qs.materials?.frame)}
                    ${renderStudioMatCol('pipe', '2. Pipe', ['pipe', 'tube'], qs.materials?.pipe)}
                    ${renderStudioMatCol('panel', '3. Panel', ['panel', 'sheet', 'glass', 'acp'], qs.materials?.panel)}
                    ${renderStudioMatCol('hinge', '4. Hinges', ['hinges', 'hinge', 'hardware'], qs.materials?.hinge)}
                    ${renderStudioMatCol('lock', '5. Lock & Accessories', ['lock', 'lock & accessories', 'accessories'], qs.materials?.lock)}
                    ${renderStudioMatCol('hook', '6. Hook & Rubber', ['hook', 'hook & rubber', 'rubber', 'handle'], qs.materials?.hook)}
                    ${renderStudioMatCol('paint', '7. Paint', ['paint', 'coating'], qs.materials?.paint)}
                </div>

                <!-- Bottom Row (Below Materials): Kalli Presets on Left + Search Bar on Right -->
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; padding-top: 8px; border-top: 1px dashed #e2e8f0;">
                    
                    <!-- WINDOW PANES & CUSTOM KALLI TOOLBAR -->
                    <div style="display: flex; align-items: stretch; border: 1px solid rgba(255,255,255,0.25); border-radius: 5px; overflow: hidden; background: #262626; box-shadow: 0 2px 5px rgba(0,0,0,0.2);">
                        <!-- Label: WINDOW PANES: -->
                        <div style="padding: 6px 14px; display: flex; align-items: center; background: rgba(255,255,255,0.06); color: #38bdf8; font-size: 0.84rem; font-weight: 800; letter-spacing: 0.5px; border-right: 1px solid rgba(255,255,255,0.18); text-transform: uppercase;">
                            WINDOW PANES:
                        </div>

                        <!-- Custom Kalli Input -->
                        <div style="display: flex; align-items: center; padding: 0 12px; border-right: 1px solid rgba(255,255,255,0.18); background: rgba(0,0,0,0.18);">
                            <span style="color: #e2e8f0; font-size: 0.82rem; font-weight: 600; margin-right: 8px;">Custom Kalli:</span>
                            <input 
                                type="number" 
                                class="hide-spin"
                                min="1" 
                                max="30" 
                                value="${cw.cols}" 
                                style="width: 44px; height: 26px; text-align: center; padding: 0; font-weight: 800; border-radius: 4px; border: 1px solid #64748b; background: #1e293b; color: white; font-size: 0.88rem; outline: none; -webkit-appearance: none; -moz-appearance: textfield; appearance: textfield;" 
                                onchange="window.loadStudioPreset(this.value)" 
                                onkeydown="if(event.key==='Enter'){ window.loadStudioPreset(this.value); this.blur(); }"
                                title="Type any number of kalli and press Enter"
                            >
                        </div>

                        <!-- Preset Buttons 1 to 5 Kalli -->
                        ${[1, 2, 3, 4, 5].map((c, idx) => `
                            <button 
                                type="button"
                                onclick="window.loadStudioPreset(${c})" 
                                style="
                                    background: ${cw.cols === c ? '#16a34a' : 'transparent'}; 
                                    color: white; 
                                    border: none; 
                                    border-right: ${idx < 4 ? '1px solid rgba(255,255,255,0.18)' : 'none'}; 
                                    padding: 6px 16px; 
                                    font-weight: 700; 
                                    font-size: 0.85rem; 
                                    cursor: pointer; 
                                    transition: all 0.15s ease-in-out;
                                    ${cw.cols === c ? 'box-shadow: inset 0 0 10px rgba(0,0,0,0.25);' : ''}
                                "
                                title="${c} Kalli (${c * 50}x140 cm)"
                                onmouseover="if(${cw.cols !== c}) this.style.background='rgba(255,255,255,0.08)'"
                                onmouseout="if(${cw.cols !== c}) this.style.background='transparent'"
                            >
                                ${c} Kalli
                            </button>
                        `).join('')}
                    </div>

                    <!-- Search Bar with Autocomplete Dropdown for Saved Files, Window Types & Models -->
                    <div style="flex: 1; max-width: 380px; min-width: 240px; margin-left: auto; position: relative;" id="calc-search-container">
                        <div style="position: relative; display: flex; align-items: center;">
                            <span style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); font-size: 0.85rem; color: #64748b; pointer-events: none; z-index: 2;">🔍</span>
                            <input 
                                type="text" 
                                id="calc-search-bar" 
                                autocomplete="off"
                                placeholder="Search window presets, types, or dimensions (e.g. 150x140)..." 
                                value="${window.calcSearchQuery || ''}"
                                onfocus="window.openCalcSearchDropdown(this.value)"
                                oninput="window.handleCalcSearchInput(this.value)"
                                onkeydown="window.handleCalcSearchKey(event)"
                                style="width: 100%; padding: 7px 32px 7px 32px; border: 1.5px solid #cbd5e1; border-radius: 6px; font-size: 0.84rem; outline: none; background: #ffffff !important; color: #0f172a !important; font-weight: 600; caret-color: #0284c7; box-shadow: inset 0 1px 2px rgba(0,0,0,0.04);"
                            >
                            <button 
                                type="button"
                                id="calc-search-clear-btn"
                                onclick="window.clearCalcSearch()" 
                                style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); background: #e2e8f0; border: none; color: #475569; width: 18px; height: 18px; border-radius: 50%; display: ${window.calcSearchQuery ? 'flex' : 'none'}; align-items: center; justify-content: center; cursor: pointer; font-size: 0.85rem; font-weight: 700; line-height: 1; padding: 0;"
                                title="Clear search"
                            >×</button>
                        </div>

                        <!-- Floating Dropdown for Saved Files, Window Types, and Presets -->
                        <div 
                            id="calc-search-dropdown" 
                            style="display: none; position: absolute; top: calc(100% + 4px); left: 0; right: 0; width: 100%; max-height: 380px; overflow-y: auto; background: #ffffff; border: 1.5px solid #0284c7; border-radius: 8px; box-shadow: 0 14px 30px -4px rgba(15, 23, 42, 0.25), 0 6px 14px -2px rgba(15, 23, 42, 0.12); z-index: 1000; text-align: left;"
                        ></div>
                    </div>

                </div>

            </div>

            <!-- 3. 2D INTERACTIVE MODEL CANVAS -->
            <div style="background: white; border: 1px solid #cbd5e1; border-radius: 8px; padding: 20px; box-shadow: 0 2px 6px rgba(0,0,0,0.04); position: relative;">
                
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: #10b981;"></span>
                        <span style="font-size: 0.85rem; font-weight: 800; color: #1e293b; text-transform: uppercase; letter-spacing: 0.5px;">Window W${itemNum} Interactive Canvas</span>
                    </div>
                    <div style="font-size: 0.78rem; color: #64748b; font-weight: 600;">
                        Area: <strong>${areaSqFt.toFixed(2)} sq.ft</strong> (${(areaSqFt * 0.0929).toFixed(2)} m²) • Perimeter: <strong>${outerPerimeterFt.toFixed(2)} ft</strong>
                    </div>
                </div>

                <div style="position: relative; width: 100%; height: 380px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden; display: flex; align-items: center; justify-content: center;">
                    
                    <!-- Top-Right Dedicated Reset Button -->
                    <button 
                        type="button" 
                        onclick="window.resetCurrentCalcWindow()" 
                        title="Reset window to clean default (removes partitions & custom widths)"
                        style="
                            position: absolute; 
                            top: 14px; 
                            right: 16px; 
                            background: #ffffff; 
                            border: 1.5px solid #cbd5e1; 
                            border-radius: 6px; 
                            padding: 5px 12px; 
                            font-size: 0.74rem; 
                            font-weight: 700; 
                            color: #475569; 
                            display: flex; 
                            align-items: center; 
                            gap: 5px; 
                            cursor: pointer; 
                            z-index: 25; 
                            box-shadow: 0 1px 3px rgba(0,0,0,0.06);
                            transition: all 0.15s ease;
                        "
                        onmouseover="this.style.borderColor='#ef4444'; this.style.color='#ef4444'; this.style.background='#fef2f2';"
                        onmouseout="this.style.borderColor='#cbd5e1'; this.style.color='#475569'; this.style.background='#ffffff';"
                    >
                        <span style="font-size: 0.85rem; line-height: 1;">↺</span> Reset
                    </button>
                    
                    <svg viewBox="0 0 ${svgW} ${svgH}" style="width: 100%; height: 100%; max-height: 380px;">
                        <rect x="${startX}" y="${startY}" width="${drawW}" height="${drawH}" fill="${profileFill}" stroke="${profileStroke}" stroke-width="${strokeW * 1.2}" rx="2" />
                        ${gridSvg}
                    </svg>

                    <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: auto;">
                        ${paneOverlays}
                    </div>

                    <!-- Left Height Input Badge: Generous Width to prevent digit truncation -->
                    <div style="position: absolute; left: 16px; top: 50%; transform: translateY(-50%); display: flex; flex-direction: column; align-items: center; z-index: 30; background: white; padding: 6px 14px; min-width: 104px; border-radius: 6px; border: 1px solid #cbd5e1; box-shadow: 0 2px 6px rgba(0,0,0,0.06);">
                        <div style="font-size: 0.68rem; color: #64748b; font-weight: 700; margin-bottom: 2px;">HEIGHT (${cw.unit})</div>
                        <input type="number" class="hide-spin" step="${cw.unit === 'mm' ? '10' : '0.5'}" min="1" value="${cw.totalH}" onchange="window.updateStudioGrid('totalH', this.value)" style="width: 96px; min-width: 96px; height: 34px; text-align: center; font-weight: 800; font-size: 1.15rem; color: #0f172a; border: 1.5px solid #0284c7; border-radius: 5px; background: #ffffff; outline: none; padding: 2px 2px; box-sizing: border-box; overflow: visible; -webkit-appearance: none; appearance: none; -moz-appearance: textfield; font-variant-numeric: tabular-nums;">
                    </div>

                    <!-- Bottom Width Badge: Generous Width to prevent digit truncation -->
                    <div style="position: absolute; left: 50%; bottom: 8px; transform: translateX(-50%); display: flex; align-items: center; gap: 8px; z-index: 30; background: white; padding: 6px 16px; border-radius: 6px; border: 1px solid #cbd5e1; box-shadow: 0 2px 6px rgba(0,0,0,0.06);">
                        <span style="font-size: 0.72rem; color: #64748b; font-weight: 700;">TOTAL W:</span>
                        <input type="number" class="hide-spin" step="${cw.unit === 'mm' ? '10' : '0.5'}" min="1" value="${cw.totalW}" onchange="window.updateStudioGrid('totalW', this.value)" style="width: 96px; min-width: 96px; height: 32px; text-align: center; font-weight: 800; font-size: 1.15rem; color: #0f172a; border: 1.5px solid #0284c7; border-radius: 5px; background: #ffffff; outline: none; padding: 2px 2px; box-sizing: border-box; overflow: visible; -webkit-appearance: none; appearance: none; -moz-appearance: textfield; font-variant-numeric: tabular-nums;">
                        <span style="font-size: 0.75rem; font-weight: 700; color: #475569;">${cw.unit}</span>
                    </div>

                </div>
            </div>

            <!-- 4. BREAKDOWN & PRICING -->
            <div style="display: grid; grid-template-columns: 1.6fr 1.1fr; gap: 1.5rem; align-items: start;">
                
                <!-- Table -->
                <div class="glass-panel" style="padding: 1.5rem; border-radius: var(--radius-lg); background: var(--color-bg-card);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.1rem; border-bottom: 1px solid var(--glass-border); padding-bottom: 0.6rem;">
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <i data-lucide="layers" style="width: 18px; height: 18px; color: var(--color-primary);"></i>
                            <h3 style="margin: 0; font-size: 0.95rem; font-weight: 700; color: var(--color-text-heading); text-transform: uppercase;">Window W${itemNum} Material Breakdown</h3>
                        </div>
                        <span style="font-size: 0.72rem; color: var(--color-text-muted);">1 unit BOM</span>
                    </div>

                    <div style="overflow-x: auto;">
                        <table style="width: 100%; border-collapse: collapse; font-size: 0.84rem;">
                            <thead>
                                <tr style="border-bottom: 1.5px solid var(--glass-border); color: var(--color-text-muted); text-align: left; font-size: 0.72rem; text-transform: uppercase;">
                                    <th style="padding: 0.5rem 0.6rem;">Material</th>
                                    <th style="padding: 0.5rem 0.6rem;">Spec / Length</th>
                                    <th style="padding: 0.5rem 0.6rem; text-align: right;">Weight</th>
                                    <th style="padding: 0.5rem 0.6rem; text-align: right;">Rate</th>
                                    <th style="padding: 0.5rem 0.6rem; text-align: right;">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr style="border-bottom: 1px solid var(--glass-border);">
                                    <td style="padding: 0.6rem; font-weight: 700; color: var(--color-text-heading);">Profile</td>
                                    <td style="padding: 0.6rem; color: var(--color-text-muted); font-size: 0.78rem;">${frameItem.name}</td>
                                    <td style="padding: 0.6rem; text-align: right; font-weight: 700; color: #3b82f6;">${frameWeightKg > 0 ? frameWeightKg.toFixed(2) + ' Kg' : '-'}</td>
                                    <td style="padding: 0.6rem; text-align: right;">${frameItem.isNone ? '-' : `${currency}${frameItem.rate}`}</td>
                                    <td style="padding: 0.6rem; text-align: right; font-weight: 800;">${currency}${frameSubtotal.toFixed(0)}</td>
                                </tr>
                                <tr style="border-bottom: 1px solid var(--glass-border);">
                                    <td style="padding: 0.6rem; font-weight: 700; color: var(--color-text-heading);">Pipe</td>
                                    <td style="padding: 0.6rem; color: var(--color-text-muted); font-size: 0.78rem;">${pipeItem.name}</td>
                                    <td style="padding: 0.6rem; text-align: right; font-weight: 700; color: #06b6d4;">${pipeWeightKg > 0 ? pipeWeightKg.toFixed(2) + ' Kg' : '-'}</td>
                                    <td style="padding: 0.6rem; text-align: right;">${pipeItem.isNone ? '-' : `${currency}${pipeItem.rate}`}</td>
                                    <td style="padding: 0.6rem; text-align: right; font-weight: 800;">${currency}${pipeSubtotal.toFixed(0)}</td>
                                </tr>
                                <tr style="border-bottom: 1px solid var(--glass-border);">
                                    <td style="padding: 0.6rem; font-weight: 700; color: var(--color-text-heading);">Panel</td>
                                    <td style="padding: 0.6rem; color: var(--color-text-muted); font-size: 0.78rem;">${panelItem.name}</td>
                                    <td style="padding: 0.6rem; text-align: right; font-weight: 700; color: #8b5cf6;">${panelWeightKg > 0 ? panelWeightKg.toFixed(2) + ' Kg' : '-'}</td>
                                    <td style="padding: 0.6rem; text-align: right;">${panelItem.isNone ? '-' : `${currency}${panelItem.rate}`}</td>
                                    <td style="padding: 0.6rem; text-align: right; font-weight: 800;">${currency}${panelSubtotal.toFixed(0)}</td>
                                </tr>
                                <tr style="border-bottom: 1px solid var(--glass-border);">
                                    <td style="padding: 0.6rem; font-weight: 700; color: var(--color-text-heading);">Hinges</td>
                                    <td style="padding: 0.6rem; color: var(--color-text-muted); font-size: 0.78rem;">${hingeItem.name} (${hingeQty} nos)</td>
                                    <td style="padding: 0.6rem; text-align: right; font-weight: 700; color: #f59e0b;">${hingeWeightKg > 0 ? hingeWeightKg.toFixed(2) + ' Kg' : '-'}</td>
                                    <td style="padding: 0.6rem; text-align: right;">${hingeItem.isNone ? '-' : `${currency}${hingeItem.rate}`}</td>
                                    <td style="padding: 0.6rem; text-align: right; font-weight: 800;">${currency}${hingeSubtotal.toFixed(0)}</td>
                                </tr>
                                <tr style="border-bottom: 1px solid var(--glass-border);">
                                    <td style="padding: 0.6rem; font-weight: 700; color: var(--color-text-heading);">Paint</td>
                                    <td style="padding: 0.6rem; color: var(--color-text-muted); font-size: 0.78rem;">${paintItem.name}</td>
                                    <td style="padding: 0.6rem; text-align: right; font-weight: 700; color: #ec4899;">-</td>
                                    <td style="padding: 0.6rem; text-align: right;">${paintItem.isNone ? '-' : `${currency}${paintItem.rate}`}</td>
                                    <td style="padding: 0.6rem; text-align: right; font-weight: 800;">${currency}${paintSubtotal.toFixed(0)}</td>
                                </tr>
                                <tr style="border-bottom: 1px solid var(--glass-border);">
                                    <td style="padding: 0.6rem; font-weight: 700; color: var(--color-text-heading);">Hook & Rubber</td>
                                    <td style="padding: 0.6rem; color: var(--color-text-muted); font-size: 0.78rem;">${hookItem.name} (${hookQty} nos)</td>
                                    <td style="padding: 0.6rem; text-align: right; font-weight: 700; color: #10b981;">${hookWeightKg > 0 ? hookWeightKg.toFixed(2) + ' Kg' : '-'}</td>
                                    <td style="padding: 0.6rem; text-align: right;">${hookItem.isNone ? '-' : `${currency}${hookItem.rate}`}</td>
                                    <td style="padding: 0.6rem; text-align: right; font-weight: 800;">${currency}${hookSubtotal.toFixed(0)}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 0.6rem; font-weight: 700; color: var(--color-text-heading);">Lock & Accessories</td>
                                    <td style="padding: 0.6rem; color: var(--color-text-muted); font-size: 0.78rem;">${lockItem.name} (${lockQty} nos)</td>
                                    <td style="padding: 0.6rem; text-align: right; font-weight: 700; color: #ef4444;">${lockWeightKg > 0 ? lockWeightKg.toFixed(2) + ' Kg' : '-'}</td>
                                    <td style="padding: 0.6rem; text-align: right;">${lockItem.isNone ? '-' : `${currency}${lockItem.rate}`}</td>
                                    <td style="padding: 0.6rem; text-align: right; font-weight: 800;">${currency}${lockSubtotal.toFixed(0)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Summary Card -->
                <div class="glass-panel" style="padding: 1.5rem; border-radius: var(--radius-lg); background: var(--color-bg-card); display: flex; flex-direction: column; gap: 1rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--glass-border); padding-bottom: 0.6rem;">
                        <h3 style="margin: 0; font-size: 0.95rem; font-weight: 700; color: var(--color-text-heading); text-transform: uppercase;">Window W${itemNum} Price</h3>
                        <span style="font-size: 0.72rem; color: #10b981; font-weight: 700;">1 Piece Calculation</span>
                    </div>

                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.7rem 1rem; background: var(--color-bg-main); border-radius: 8px; border: 1px solid var(--glass-border);">
                        <span style="font-size: 0.8rem; font-weight: 700; color: var(--color-text-heading);">Material Cost</span>
                        <span style="font-size: 1.1rem; font-weight: 800;">${currency} ${totalMaterialCost.toFixed(0)}</span>
                    </div>

                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.7rem 1rem; background: var(--color-bg-main); border-radius: 8px; border: 1px solid var(--glass-border);">
                        <span style="font-size: 0.8rem; font-weight: 700; color: var(--color-text-heading);">Labor Charges</span>
                        <div style="display: flex; align-items: center; gap: 6px;">
                            <span style="font-size: 0.85rem; font-weight: 700; color: var(--color-text-muted);">${currency}</span>
                            <input type="number" step="50" min="0" value="${laborCharges}" onchange="window.updateStudioGrid('laborCharge', this.value)" style="width: 80px; text-align: right; padding: 4px 6px; font-weight: 800; font-size: 0.9rem; border-radius: 5px; border: 1px solid var(--glass-border); background: var(--color-bg-card); color: var(--color-text-main);">
                        </div>
                    </div>

                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.7rem 1rem; background: var(--color-bg-main); border-radius: 8px; border: 1px solid var(--glass-border);">
                        <span style="font-size: 0.8rem; font-weight: 700; color: var(--color-text-heading);">Margin / Profit %</span>
                        <div style="display: flex; align-items: center; gap: 6px;">
                            <input type="number" step="1" min="0" max="100" value="${profitMarginPercent}" onchange="window.updateStudioGrid('profitMarginPercent', this.value)" style="width: 60px; text-align: right; padding: 4px 6px; font-weight: 800; font-size: 0.9rem; border-radius: 5px; border: 1px solid var(--glass-border); background: var(--color-bg-card); color: #10b981;">
                            <span style="font-size: 0.85rem; font-weight: 800; color: var(--color-text-muted);">%</span>
                        </div>
                    </div>

                    <!-- Single Unit Grand Total -->
                    <div style="padding: 1.1rem 1rem; background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(6, 182, 212, 0.1)); border: 2px solid rgba(16, 185, 129, 0.4); border-radius: 10px; text-align: center;">
                        <div style="font-size: 0.72rem; font-weight: 800; color: #10b981; text-transform: uppercase;">Window W${itemNum} Unit Price</div>
                        <div style="font-size: 2rem; font-weight: 900; color: var(--color-text-heading); margin: 2px 0;">
                            ${currency}${Math.round(grandTotal).toLocaleString('en-IN')}
                        </div>
                        <div style="font-size: 0.75rem; color: var(--color-text-muted); font-weight: 600;">
                            ${currency} ${(grandTotal / areaSqFt).toFixed(0)} / sq.ft
                        </div>
                    </div>

                </div>

            </div>

            <!-- Live Saved Windows in this Quotation -->
            ${draftItems.length > 0 ? `
                <div style="background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 10px; padding: 12px 18px; margin-bottom: 0.75rem; box-shadow: 0 2px 6px rgba(0,0,0,0.03);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <span style="font-size: 0.8rem; font-weight: 800; color: #1e293b; text-transform: uppercase; letter-spacing: 0.5px; display: flex; align-items: center; gap: 6px;">
                            <span>📋</span> Saved Windows in this Quotation (${draftItems.length})
                        </span>
                        <span style="font-size: 0.82rem; font-weight: 800; color: #0284c7;">
                            Running Total: ₹${draftItems.reduce((s, it) => s + (it.total || 0), 0).toLocaleString('en-IN')}
                        </span>
                    </div>
                    <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                        ${draftItems.map((it, idx) => `
                            <div style="background: white; border: 1px solid #94a3b8; border-radius: 6px; padding: 6px 12px; font-size: 0.78rem; font-weight: 700; color: #0f172a; display: flex; align-items: center; gap: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
                                <span style="background: #0284c7; color: white; padding: 1px 6px; border-radius: 4px; font-size: 0.72rem;">W${idx + 1}</span>
                                <span>${it.cols} Kalli (${it.width}×${it.height} ${it.unit})</span>
                                <span style="background: #e0f2fe; color: #0369a1; padding: 1px 7px; border-radius: 4px;">${it.qty} pcs</span>
                                <span style="color: #059669; font-weight: 800;">₹${(it.total || 0).toLocaleString('en-IN')}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}

            <!-- 5. BOTTOM ACTION BAR: Quantity Column on Left + Save & New + Save Final on Right -->
            <div class="glass-panel" style="padding: 1.1rem 1.75rem; border-radius: var(--radius-lg); background: var(--color-bg-card); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1.25rem; border-top: 2px solid var(--glass-border); box-shadow: 0 4px 20px rgba(0,0,0,0.12);">
                
                <!-- Bottom Left: Quantity Input & Batch Cost -->
                <div style="display: flex; align-items: center; gap: 1.25rem;">
                    <div style="display: flex; align-items: center; gap: 0.75rem; background: var(--color-bg-main); padding: 8px 14px; border-radius: 8px; border: 1.5px solid var(--glass-border);">
                        <label style="font-size: 0.85rem; font-weight: 800; color: var(--color-text-heading); text-transform: uppercase; letter-spacing: 0.5px;">Quantity:</label>
                        <input 
                            type="number" 
                            id="studio-item-qty" 
                            class="hide-spin"
                            min="1" 
                            step="1" 
                            value="${currentQty}" 
                            oninput="window.updateStudioQty(this.value)"
                            onchange="window.updateStudioQty(this.value); Store.notify();"
                            style="width: 65px; height: 32px; text-align: center; font-weight: 900; font-size: 1.1rem; color: var(--color-primary); border: 1.5px solid var(--color-primary); border-radius: 6px; background: var(--color-bg-card); outline: none; -webkit-appearance: none; -moz-appearance: textfield; appearance: textfield;"
                        >
                    </div>

                    <div style="display: flex; flex-direction: column;">
                        <span id="studio-unit-calc-text" style="font-size: 0.72rem; color: var(--color-text-muted); font-weight: 600;">Unit: ${currency}${Math.round(grandTotal).toLocaleString('en-IN')} × ${currentQty} nos</span>
                        <span id="studio-total-calc-text" style="font-size: 1.15rem; font-weight: 900; color: #10b981;">Total: ${currency}${Math.round(grandTotal * currentQty).toLocaleString('en-IN')}</span>
                    </div>

                    ${draftItems.length > 0 ? `
                        <div style="margin-left: 0.5rem; padding: 4px 10px; background: rgba(59, 130, 246, 0.12); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 6px; font-size: 0.78rem; font-weight: 700; color: #3b82f6;">
                            ${draftItems.length} prior window(s) saved in this quote
                        </div>
                    ` : ''}
                </div>

                <!-- Bottom Right: Save & New, Save Final, and Cancel -->
                <div style="display: flex; align-items: center; gap: 0.85rem;">
                    <button 
                        type="button" 
                        class="btn btn-secondary" 
                        onclick="window.cancelQuotationStudio()" 
                        style="padding: 0.65rem 1.2rem; font-size: 0.88rem; font-weight: 600;"
                    >
                        Cancel
                    </button>

                    <button 
                        type="button" 
                        onclick="window.saveQuotationItemAndNew()" 
                        class="btn btn-secondary"
                        style="padding: 0.65rem 1.4rem; font-size: 0.9rem; font-weight: 700; background: linear-gradient(135deg, #0284c7, #0369a1); color: white; border: none; border-radius: 8px; display: flex; align-items: center; gap: 6px; box-shadow: 0 4px 12px rgba(2, 132, 199, 0.3); cursor: pointer;"
                        title="Save current window calculation and calculate next window for this customer"
                    >
                        <i data-lucide="plus-circle" style="width: 16px; height: 16px;"></i>
                        Save & New
                    </button>

                    <button 
                        type="button" 
                        onclick="window.saveQuotationFinal()" 
                        class="btn btn-primary"
                        style="padding: 0.65rem 1.6rem; font-size: 0.92rem; font-weight: 800; background: linear-gradient(135deg, #10b981, #059669); color: white; border: none; border-radius: 8px; display: flex; align-items: center; gap: 6px; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35); cursor: pointer;"
                        title="Save all windows and finalize quotation"
                    >
                        <i data-lucide="check-circle-2" style="width: 16px; height: 16px;"></i>
                        Save
                    </button>
                </div>

            </div>

        </div>
    `;
}

// Render Designer (keep as fallback)
function renderDesigner(state) {
    return `<div style="padding:20px;">Designer mode reserved for future detailed editing. Use Quick Rate Calculator for now.</div>`;
}



// DXF Generator (Minimal)
window.downloadDXF = () => {
    const s = Store.state.calcState;
    if (!s) return;

    let dxf = "";

    // Header
    dxf += "0\nSECTION\n2\nHEADER\n0\nENDSEC\n";
    // Entities Section Start
    dxf += "0\nSECTION\n2\nENTITIES\n";

    // Helper: Add Line
    const addLine = (x1, y1, x2, y2) => {
        dxf += "0\nLINE\n8\n0\n10\n" + x1 + "\n20\n" + y1 + "\n11\n" + x2 + "\n21\n" + y2 + "\n";
    };

    // Helper: Add Rect (LWPOLYLINE)
    const addRect = (x, y, w, h) => {
        dxf += "0\nLWPOLYLINE\n8\n0\n90\n4\n70\n1\n";
        dxf += "10\n" + x + "\n20\n" + y + "\n";
        dxf += "10\n" + (x + w) + "\n20\n" + y + "\n";
        dxf += "10\n" + (x + w) + "\n20\n" + (y + h) + "\n";
        dxf += "10\n" + x + "\n20\n" + (y + h) + "\n";
    };

    // --- content generation based on model ---
    if (s.selectedModel === 'grid_4_panel') {
        const w = s.width;
        const h = s.height;
        const colW = w / s.cols;
        const rowH = h / s.rows;

        // Outer Frame
        addRect(0, 0, w, h);

        // Vertical Dividers
        for (let i = 1; i < s.cols; i++) {
            addLine(i * colW, 0, i * colW, h);
        }

        // Horizontal Lines
        for (let j = 1; j < s.rows; j++) {
            addLine(0, j * rowH, w, j * rowH);
        }

    } else if (s.selectedModel === 'triple_panel_door') {
        // Simple Triple Panel logic
        const sideW = s.sidePanelWidth;
        const doorW = s.mainDoorWidth;
        const totalW = s.width;  // Ideally should match side*2 + door
        const h = s.height;

        // Panel 1 (Left)
        addRect(0, 0, sideW, h);
        // Door (Center)
        addRect(sideW, 0, doorW, h);
        // Panel 2 (Right)
        addRect(sideW + doorW, 0, sideW, h);

        // Add some horizontals for completeness based on heights
        if (s.topHeight) {
            addLine(0, s.topHeight, sideW, s.topHeight);
            addLine(sideW + doorW, s.topHeight, totalW, s.topHeight);
        }
    } else {
        // Fallback: Just outer box
        addRect(0, 0, s.width, s.height);
    }

    // Entities Section End
    dxf += "0\nENDSEC\n0\nEOF";

    // Download Logic
    const blob = new Blob([dxf], { type: 'application/dxf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `design_${s.selectedModel || 'custom'}.dxf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    alert(`DXF Exported successfully!\nFile: design_${s.selectedModel || 'custom'}.dxf\nCheck your Downloads folder.`);
};

// remove unused updateDesignerTab since we removed tabs
window.updateDesignerTab = (tab) => { };

// Add helper to extract BOM from current state (duplicated logic for now, but clean for this purpose)
// Helper to extract BOM from current state
function calculateCurrentBOM(s) {
    const defaults = {
        pipe: { name: 'Sq Pipe 1"x1" (1.2mm)', unit: 'mtr', rate: 85, weight: 1.15 },
        sheet: { name: 'MS Sheet 16G', unit: 'sq.ft', rate: 65, weight: 1.25 },
        hinge: { name: 'Steel Hinge 4"', unit: 'nos', rate: 25, weight: 0.12 },
        towerbolt: { name: 'Towerbolt 6"', unit: 'nos', rate: 45, weight: 0.18 },
        paint: { name: 'Epoxy Paint', unit: 'ltr', rate: 450, coverage: 12 },
        primer: { name: 'Metal Primer', unit: 'ltr', rate: 220, coverage: 14 },
        labor: { name: 'Fabrication Labor', unit: 'sq.ft', rate: 15 },
        consumables: { name: 'Welding Rod/Disc', unit: 'lot', rate: 150, weight: 0 },
        // Add glass for completeness if needed (optional)
        glass: { name: 'Glass 5mm', unit: 'sq.ft', rate: 85, weight: 0 }
    };
    const materials = Store.state.calcSettings || defaults;

    const q = s.qty;

    // Convert dimensions to meters
    const Wm = s.width / 1000;
    const Hm = s.height / 1000;
    const sideWm = s.sidePanelWidth / 1000;
    const doorWm = s.mainDoorWidth / 1000;

    // Steel Calculation (Estimation)
    // 1. Outer Frame & Mullions (4 verticals max height + top/bot horizontal)
    // Actually: 2 Outer verticals, 2 Inner verticals (mullions), Top, Bottom.
    const verticalM = Hm * 4;
    const horizontalM = Wm * 2;

    // 2. Transoms (Horizontal dividers in side panels)
    // Top-Mid divider + Mid-Bot divider = 2 per side panel = 4 total
    const transomM = sideWm * 4;

    // 3. Door Frame & Leaf
    // Door has its own frame (already accounted for in verticals above? sorta, let's add leaf)
    // Door Leaf: 2 verticals + 2 horizontals
    const doorLeafM = (Hm * 2) + (doorWm * 2);

    // 4. Grill Bars (Mid section of side panels)
    // Assume vertical spacing 100mm, horizontal 300mm?
    // Let's just estimate grill density as 3m per sq meter of grill area
    const grillAreaM2 = (sideWm * (s.midHeight / 1000)) * 2; // 2 panels
    const grillM = grillAreaM2 * 8; // Dense grill

    // 5. Louver Strips (Bot section)
    // Horizontal strips every 60mm
    const louverCount = (s.botHeight / 60);
    const louverM = (sideWm * louverCount) * 2; // 2 panels

    const totalPipeM = (verticalM + horizontalM + transomM + doorLeafM + grillM + louverM) * 1.10; // +10% waste

    // Sheet Calculation (Louver backing + Door bottom kick plate?)
    // Let's assume sheet used for Louver blades if not flat bar? 
    // And maybe door bottom panel.
    // For estimation: 30% of total area is sheet covered (kick plates etc)
    const totalAreaM2 = Wm * Hm;
    const sheetAreaM2 = totalAreaM2 * 0.2;
    const sheetAreaSqFt = sheetAreaM2 * 10.764;

    // Hardware
    const hinges = 3; // Main door
    const bolts = 2; // Main door

    const areaSqFt = totalAreaM2 * 10.764;
    const paintLtr = (totalAreaM2 * 2.5) / materials.paint.coverage; // 2.5 factor for surface area of pipes

    return [
        { item: materials.pipe.name, unit: materials.pipe.unit, qty: totalPipeM * q, weight: (totalPipeM * materials.pipe.weight) * q, rate: materials.pipe.rate, amount: (totalPipeM * materials.pipe.rate) * q },
        { item: materials.sheet.name, unit: materials.sheet.unit, qty: sheetAreaSqFt * q, weight: (sheetAreaSqFt * materials.sheet.weight) * q, rate: materials.sheet.rate, amount: (sheetAreaSqFt * materials.sheet.rate) * q },
        { item: materials.hinge.name, unit: materials.hinge.unit, qty: hinges * q, weight: (hinges * materials.hinge.weight) * q, rate: materials.hinge.rate, amount: (hinges * materials.hinge.rate) * q },
        { item: materials.towerbolt.name, unit: materials.towerbolt.unit, qty: bolts * q, weight: (bolts * materials.towerbolt.weight) * q, rate: materials.towerbolt.rate, amount: (bolts * materials.towerbolt.rate) * q },
        { item: materials.paint.name, unit: materials.paint.unit, qty: paintLtr * q, weight: 0, rate: materials.paint.rate, amount: (paintLtr * materials.paint.rate) * q },
        { item: materials.consumables.name, unit: materials.consumables.unit, qty: q, weight: 0, rate: materials.consumables.rate, amount: materials.consumables.rate * q },
        { item: materials.labor.name, unit: materials.labor.unit, qty: areaSqFt * q, weight: 0, rate: materials.labor.rate, amount: (areaSqFt * materials.labor.rate) * q }
    ];
}

// Helper to generate BOM from Rate Calc state
function calculateRateCalcBOM(rc) {
    const settings = Store.state.calcSettings || {};
    const d = rc.designer;
    const o = rc.options;

    // Base Calculations (in Meters)
    const w_m = d.totalW / 1000;
    const h_m = d.totalH / 1000;

    let frameLenM = (2 * w_m) + (2 * h_m);
    let mullionLenM = (d.mullions * h_m) + (d.transoms * w_m);

    if (rc.category === 'Casement' || rc.category === 'Pivot') frameLenM *= 1.5;
    if (rc.category === 'Sliding' || rc.category === 'French') frameLenM *= 1.8;

    const totalSteelM = frameLenM + mullionLenM;
    const pipeWeightPerM = settings.pipe ? (settings.pipe.weight || 1.15) : 1.15;
    const pipeRate = settings.pipe ? (settings.pipe.rate || 85) : 85;
    const totalWeightKG = totalSteelM * pipeWeightPerM;
    const steelCost = totalWeightKG * pipeRate;

    const areaSqM = w_m * h_m;
    const areaSqFt = areaSqM * 10.7639;
    const glassObj = settings[o.glass] || { rate: 0, name: 'Glass' };
    const glassCost = areaSqFt * (glassObj.rate || 0);

    let hwQty = 1;
    if (rc.category === 'French' || rc.category === 'Sliding') hwQty = 2;
    const hwObj = settings[o.hardware] || { rate: 0, name: 'Hardware' };
    let hardwareCost = hwQty * (hwObj.rate || 0);

    let hingeCost = 0;
    let hinges = 0;
    if (['Casement', 'Pivot', 'French'].includes(rc.category)) {
        hinges = hwQty * 3;
        const hingeRate = settings.hinge ? (settings.hinge.rate || 25) : 25;
        hingeCost = hinges * hingeRate;
    }

    const laborRate = settings.labor ? (settings.labor.rate || 15) : 15;
    const laborCost = areaSqFt * laborRate;

    const paintRate = settings.paint ? (settings.paint.rate || 450) : 450;
    const paintCoverage = settings.paint ? (settings.paint.coverage || 12) : 12;
    const paintLtr = (areaSqM * 1.5) / paintCoverage;
    const finishCost = paintLtr * paintRate;

    const bom = [];
    bom.push({ item: 'Steel Profile', unit: 'kg', qty: totalWeightKG, weight: totalWeightKG, rate: pipeRate, amount: steelCost });
    bom.push({ item: glassObj.name, unit: 'sq.ft', qty: areaSqFt, weight: 0, rate: glassObj.rate, amount: glassCost });
    bom.push({ item: hwObj.name, unit: 'pcs', qty: hwQty, weight: 0, rate: hwObj.rate, amount: hardwareCost });
    if (hinges > 0) bom.push({ item: 'Hinges', unit: 'pcs', qty: hinges, weight: 0, rate: settings.hinge ? settings.hinge.rate : 25, amount: hingeCost });
    bom.push({ item: 'Labor', unit: 'sq.ft', qty: areaSqFt, weight: 0, rate: laborRate, amount: laborCost });
    bom.push({ item: 'Painting', unit: 'ltr', qty: paintLtr, weight: 0, rate: paintRate, amount: finishCost });

    return bom;
}

window.addToQuote = (cost) => {
    const state = Store.state;
    if (state.calcTab === 'manual' && state.rateCalc) {
        const rc = state.rateCalc;
        const d = rc.designer;
        const bom = calculateRateCalcBOM(rc);
        state.currentQuoteItems.push({
            type: `${rc.category} Window`,
            width: d.totalW,
            height: d.totalH,
            qty: 1,
            cost: parseFloat(cost),
            total: parseFloat(cost),
            bom: bom
        });
    } else {
        const s = state.calcState;
        if (!s) return;
        const bom = calculateCurrentBOM(s);
        state.currentQuoteItems.push({
            type: 'Custom Window',
            width: s.width,
            height: s.height,
            qty: s.qty,
            cost: parseFloat(cost),
            total: parseFloat(cost),
            bom: bom
        });
    }

    alert("Item added. Click 'Project Report' to see full details.");
    Store.notify();
};

// ... (addToQuote logic from previous step) ...

window.renderQuoteReport = () => {
    const items = Store.state.currentQuoteItems;
    if (!items || items.length === 0) return `<div class="glass-panel" style="padding: 2rem; text-align: center;">No items to report. Add items from the Quick Estimator first.</div>`;

    // Aggregate BOM
    const summary = {};
    let totalProjectCost = 0;
    let totalProjectWeight = 0;

    items.forEach(item => {
        totalProjectCost += item.total;
        if (item.bom) {
            item.bom.forEach(b => {
                if (!summary[b.item]) {
                    summary[b.item] = { ...b }; // Clone first occurrence
                } else {
                    summary[b.item].qty += b.qty;
                    summary[b.item].weight += b.weight;
                    summary[b.item].amount += b.amount;
                }
                totalProjectWeight += b.weight;
            });
        }
    });

    const bomRows = Object.values(summary);

    return `
    <div id="calc-printable-report" class="glass-panel" style="padding: 2rem; max-width: 900px; margin: 0 auto; height: 100%; overflow-y: auto;">
            <div class="no-print" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; border-bottom: 1px solid var(--glass-border); padding-bottom: 1rem;">
                <div>
                    <h2 style="margin: 0;">Project Calculation Report</h2>
                    <p style="color: var(--color-text-muted); margin: 0;">Consolidated Branch of Materials for ${items.length} Items</p>
                </div>
                <div style="display: flex; gap: 0.6rem; align-items: center;">
                     <button class="btn btn-secondary" onclick="window.sharePrintDoc('Calculation Report', 'Calculation-Report', 'Project Calculation Report', 'Client', 0, '')" style="background: #2563eb; border: 1px solid #2563eb; color: white; display: flex; align-items: center; gap: 6px;"><i data-lucide="share-2" style="width: 15px;"></i> Share</button>
                     <button class="btn btn-secondary" onclick="window.downloadPrintDoc('calc-printable-report', 'Project-Calculation-Report')" style="background: #475569; border: 1px solid #64748b; color: white; display: flex; align-items: center; gap: 6px;"><i data-lucide="download" style="width: 15px;"></i> Download</button>
                     <button onclick="window.print()" class="btn btn-secondary" style="background: #10b981; border: 1px solid #10b981; color: white; display: flex; align-items: center; gap: 6px;"><i data-lucide="printer" style="width: 15px;"></i> Print</button>
                     <button onclick="window.calcSwitchTab('designer')" class="btn btn-secondary"><i data-lucide="x"></i> Close</button>
                </div>
            </div>

            <!--Material Breakdown Table-- >
            <h4 style="margin-bottom: 1rem; color: var(--color-accent);">Total Materials Required</h4>
            <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--glass-border); border-radius: 8px; margin-bottom: 2rem; overflow: hidden;">
                <table style="width: 100%; border-collapse: collapse;">
                    <thead style="background: rgba(255,255,255,0.05); color: #ccc; font-size: 0.85rem;">
                        <tr>
                            <th style="padding: 1rem; text-align: left;">Material Item</th>
                            <th style="padding: 1rem; text-align: center;">Total Qty</th>
                            <th style="padding: 1rem; text-align: right;">Weight (Kg)</th>
                             <th style="padding: 1rem; text-align: right;">Cost</th>
                        </tr>
                    </thead>
                    <tbody style="font-size: 0.9rem;">
                        ${bomRows.map(row => `
                            <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                                <td style="padding: 0.75rem 1rem;">${row.item}</td>
                                <td style="padding: 0.75rem 1rem; text-align: center;">${row.qty.toFixed(1)} <span style="color:#777; font-size:0.75rem;">${row.unit}</span></td>
                                <td style="padding: 0.75rem 1rem; text-align: right;">${row.weight.toFixed(1)}</td>
                                <td style="padding: 0.75rem 1rem; text-align: right;">${row.amount.toFixed(0)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                    <tfoot style="background: rgba(255,255,255,0.1); font-weight: bold;">
                        <tr>
                            <td style="padding: 1rem;">Totals</td>
                            <td style="padding: 1rem; text-align: center;">-</td>
                            <td style="padding: 1rem; text-align: right;">${totalProjectWeight.toFixed(1)} Kg</td>
                            <td style="padding: 1rem; text-align: right; color: var(--color-accent); font-size: 1.1rem;">${totalProjectCost.toFixed(0)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            <!--Item Breakdown Table-- >
            <h4 style="margin-bottom: 1rem; color: #aaa;">Item Breakdown</h4>
            <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--glass-border); border-radius: 8px; overflow: hidden;">
                <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
                    <thead style="background: rgba(255,255,255,0.05);">
                        <tr>
                            <th style="padding: 0.75rem; text-align: left;">#</th>
                            <th style="padding: 0.75rem; text-align: left;">Description</th>
                            <th style="padding: 0.75rem; text-align: center;">Qty</th>
                            <th style="padding: 0.75rem; text-align: right;">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                         ${items.map((item, idx) => `
                            <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                                <td style="padding: 0.75rem;">${idx + 1}</td>
                                <td style="padding: 0.75rem;">Window ${item.width}x${item.height}</td>
                                <td style="padding: 0.75rem; text-align: center;">${item.qty}</td>
                                <td style="padding: 0.75rem; text-align: right;">${item.total.toFixed(0)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div >
    `;
};

window.removeQuoteItem = (idx) => {
    Store.state.currentQuoteItems.splice(idx, 1);
    Store.notify();
};

// Ensure updateDesign handles nested properties correctly or simple ones
// Update Design Handler
// Update Design Handler
window.updateDesign = (key, value) => {
    const s = Store.state.calcState;
    const floatVal = parseFloat(value);

    // Common
    if (key === 'selectedModel') s.selectedModel = value;
    if (key === 'width') s.width = floatVal;
    if (key === 'height') s.height = floatVal;
    if (key === 'frameColor') s.frameColor = value;
    if (key === 'qty') s.qty = parseInt(value) || 1;

    // Grid Model Specifics
    if (key === 'cols') s.cols = parseInt(value);
    if (key === 'rows') s.rows = parseInt(value);

    // Triple Panel Specifics (Legacy/Alternative)
    if (key === 'sidePanelWidth') s.sidePanelWidth = floatVal;
    if (key === 'mainDoorWidth') s.mainDoorWidth = floatVal;
    if (key === 'topHeight') s.topHeight = floatVal;
    if (key === 'midHeight') s.midHeight = floatVal;
    if (key === 'botHeight') s.botHeight = floatVal;
    if (key === 'frame.side') {
        s.frame.side = floatVal;
        s.frame.top = floatVal;
        s.frame.bottom = floatVal;
        s.frame.mid = floatVal;
    }

    // Trigger Re-render
    Store.notify();
};

// =========================================================================
// --- DETAILED CALCULATION STUDIO & 2D DYNAMIC VISUALIZER ---
// =========================================================================

export function initStudioCalcState() {
    if (!Store.state.calcStudio) {
        Store.state.calcStudio = {
            customerName: '',
            customerId: '',
            customerPhone: '',
            customerLocation: '',
            itemName: 'Window W1',
            width: 120, // cm
            height: 150, // cm
            quantity: 1,
            profileId: 'prof_box',
            tubeId: 'tube_sq_1x1',
            glassId: 'glass_5mm_clear',
            hingeId: 'hinge_ss_4in',
            lockId: 'lock_cockspur',
            paintId: 'paint_epoxy_black',
            partitionPreset: '2x1', // 1x1, 2x1, 3x1, 1x2, 2x2, 3x2, custom
            cols: 2,
            rows: 1,
            orientation: 'vertical', // 'vertical', 'horizontal', 'grid'
            includeSash: true, // Sash / Panel (പാളി)
            marginPct: 20
        };
    }

    // Synchronize draft customer if available
    const draft = Store.state.currentQuoteDraft;
    if (draft && draft.customer && !Store.state.calcStudio.customerName) {
        Store.state.calcStudio.customerName = draft.customer;
        Store.state.calcStudio.customerId = draft.customerId || '';
        Store.state.calcStudio.customerPhone = draft.customerPhone || '';
        Store.state.calcStudio.customerLocation = draft.customerAddress || '';
    }
}

// Helper to look up material from Catalog or fallback
function getStudioMaterial(id, category, fallback) {
    const catalog = Store.state.materialCatalog || [];
    let found = catalog.find(m => m.id === id);
    if (!found && category) {
        found = catalog.find(m => m.category === category);
    }
    return found || fallback;
}

// -------------------------------------------------------------------------
// 1. DYNAMIC COST BREAKDOWN & SECTION DETAILS
// -------------------------------------------------------------------------
export function calculateStudioCostBreakdown(calc, catalog) {
    const qty = Math.max(1, parseInt(calc.quantity) || 1);
    const w_cm = parseFloat(calc.width) || 100;
    const h_cm = parseFloat(calc.height) || 100;
    const w_m = w_cm / 100;
    const h_m = h_cm / 100;

    const area_sq_m = (w_m * h_m) * qty;
    const area_sq_ft = area_sq_m * 10.7639;

    // Materials lookup from Catalog
    const profile = getStudioMaterial(calc.profileId, 'Profile', { name: 'Box Profile (50x25mm)', unit: 'kg', rate: 180, weightFactor: 1.45 });
    const tube = getStudioMaterial(calc.tubeId, 'Square Tube', { name: '1"x1" MS Tube', unit: 'kg', rate: 95, weightFactor: 1.15 });
    const glass = getStudioMaterial(calc.glassId, 'Glass', { name: '5mm Clear Float Glass', unit: 'sq.ft', rate: 55, weightFactor: 1.15 });
    const hinge = getStudioMaterial(calc.hingeId, 'Hinges', { name: 'SS Butt Hinge 4"', unit: 'pcs', rate: 85, weightFactor: 0.18 });
    const lock = getStudioMaterial(calc.lockId, 'Lock', { name: 'Cockspur Window Lock', unit: 'pcs', rate: 160, weightFactor: 0.25 });
    const paint = getStudioMaterial(calc.paintId, 'Paint', { name: 'Epoxy Powder Coating', unit: 'ltr', rate: 480, coverage: 12 });

    // Grid Dimensions
    let cols = 1;
    let rows = 1;
    if (calc.partitionPreset === '1x1') { cols = 1; rows = 1; }
    else if (calc.partitionPreset === '2x1') { cols = 2; rows = 1; }
    else if (calc.partitionPreset === '3x1') { cols = 3; rows = 1; }
    else if (calc.partitionPreset === '1x2') { cols = 1; rows = 2; }
    else if (calc.partitionPreset === '2x2') { cols = 2; rows = 2; }
    else if (calc.partitionPreset === '3x2') { cols = 3; rows = 2; }
    else if (calc.partitionPreset === '2x3') { cols = 2; rows = 3; }
    else {
        cols = Math.max(1, parseInt(calc.cols) || 1);
        rows = Math.max(1, parseInt(calc.rows) || 1);
    }

    // 1. Outer Frame Profile
    const outerPerimeter_m = 2 * (w_m + h_m) * qty;
    let profReqUnit = '';
    let profCost = 0;
    let profWeightKg = 0;
    if (profile.unit === 'kg') {
        profWeightKg = outerPerimeter_m * (profile.weightFactor || 1.45);
        profReqUnit = `${profWeightKg.toFixed(2)} kg`;
        profCost = profWeightKg * profile.rate;
    } else {
        profReqUnit = `${outerPerimeter_m.toFixed(2)} mtr`;
        profCost = outerPerimeter_m * profile.rate;
    }

    // 2. Square Tubes (Inner Partitions + Sash Frame)
    let innerTube_m = 0;
    if (calc.orientation === 'vertical') {
        innerTube_m += (cols - 1) * h_m * qty;
    } else if (calc.orientation === 'horizontal') {
        innerTube_m += (rows - 1) * w_m * qty;
    } else { // Grid
        innerTube_m += ((cols - 1) * h_m + (rows - 1) * w_m) * qty;
    }

    // Additional sash frame tube if sash is included
    if (calc.includeSash) {
        const sashW_m = w_m / cols;
        const sashH_m = h_m / rows;
        innerTube_m += 2 * (sashW_m + sashH_m) * qty;
    }

    let tubeReqUnit = '';
    let tubeCost = 0;
    let tubeWeightKg = 0;
    if (tube.unit === 'kg') {
        tubeWeightKg = innerTube_m * (tube.weightFactor || 1.15);
        tubeReqUnit = `${tubeWeightKg.toFixed(2)} kg`;
        tubeCost = tubeWeightKg * tube.rate;
    } else {
        tubeReqUnit = `${innerTube_m.toFixed(2)} mtr`;
        tubeCost = innerTube_m * tube.rate;
    }

    // 3. Glass / Panel
    let glassReqUnit = '';
    let glassCost = 0;
    if (glass.unit === 'sq.ft') {
        glassReqUnit = `${area_sq_ft.toFixed(2)} sq.ft`;
        glassCost = area_sq_ft * glass.rate;
    } else {
        glassReqUnit = `${area_sq_m.toFixed(2)} sq.m`;
        glassCost = area_sq_m * glass.rate;
    }

    // 4. Hinges
    const hingeCount = calc.includeSash ? (h_cm > 150 ? 3 : 2) * qty : 0;
    const hingeReqUnit = `${hingeCount} pcs`;
    const hingeCost = hingeCount * hinge.rate;

    // 5. Lock
    const lockCount = calc.includeSash ? 1 * qty : 0;
    const lockReqUnit = `${lockCount} pcs`;
    const lockCost = lockCount * lock.rate;

    // 6. Paint / Finish
    const paintedArea_m2 = area_sq_m * 2.2;
    const coverage = paint.coverage || 12;
    const paintLtr = Math.max(0.15, paintedArea_m2 / coverage);
    const paintReqUnit = `${paintLtr.toFixed(2)} ltr`;
    const paintCost = paintLtr * paint.rate;

    // 7. Fabrication Labor & Fasteners
    const laborRate = 25; // ₹25 per sq.ft
    const laborCost = area_sq_ft * laborRate;
    const consumablesCost = 150 * qty;

    const materialsTotal = profCost + tubeCost + glassCost + hingeCost + lockCost + paintCost + consumablesCost;
    const netProductionCost = materialsTotal + laborCost;
    const marginPct = parseFloat(calc.marginPct) || 20;
    const finalBatchPrice = Math.round(netProductionCost * (1 + marginPct / 100));
    const unitPrice = Math.round(finalBatchPrice / qty);

    const bom = [
        {
            component: 'Outer Frame Profile',
            spec: profile.name,
            uom: profile.unit,
            requiredUnit: profReqUnit,
            rate: profile.rate,
            amount: Math.round(profCost)
        },
        {
            component: 'Square Tube Partitions & Sash',
            spec: `${tube.name} (${calc.orientation.toUpperCase()}${calc.includeSash ? ' + Sash' : ''})`,
            uom: tube.unit,
            requiredUnit: tubeReqUnit,
            rate: tube.rate,
            amount: Math.round(tubeCost)
        },
        {
            component: 'Glazing / Panel Infill',
            spec: glass.name,
            uom: glass.unit,
            requiredUnit: glassReqUnit,
            rate: glass.rate,
            amount: Math.round(glassCost)
        },
        {
            component: 'Hardware Hinges',
            spec: hinge.name,
            uom: 'pcs',
            requiredUnit: hingeReqUnit,
            rate: hinge.rate,
            amount: Math.round(hingeCost)
        },
        {
            component: 'Locking Mechanism',
            spec: lock.name,
            uom: 'pcs',
            requiredUnit: lockReqUnit,
            rate: lock.rate,
            amount: Math.round(lockCost)
        },
        {
            component: 'Protective Paint & Coating',
            spec: paint.name,
            uom: paint.unit,
            requiredUnit: paintReqUnit,
            rate: paint.rate,
            amount: Math.round(paintCost)
        },
        {
            component: 'Fabrication Labor & Assembly',
            spec: `Cutting, Miter Welding, Glazing & QC (₹${laborRate}/sq.ft)`,
            uom: 'sq.ft',
            requiredUnit: `${area_sq_ft.toFixed(1)} sq.ft`,
            rate: laborRate,
            amount: Math.round(laborCost)
        },
        {
            component: 'Fasteners, Sealant & Consumables',
            spec: 'Weather silicone gasket, anchors & screws',
            uom: 'lot',
            requiredUnit: `${qty} lot`,
            rate: 150,
            amount: consumablesCost
        }
    ];

    return {
        profile,
        tube,
        glass,
        hinge,
        lock,
        paint,
        cols,
        rows,
        area_sq_m,
        area_sq_ft,
        profReqUnit,
        profCost: Math.round(profCost),
        tubeReqUnit,
        tubeCost: Math.round(tubeCost),
        glassReqUnit,
        glassCost: Math.round(glassCost),
        hingeCount,
        hingeReqUnit,
        hingeCost: Math.round(hingeCost),
        lockCount,
        lockReqUnit,
        lockCost: Math.round(lockCost),
        paintLtr,
        paintReqUnit,
        paintCost: Math.round(paintCost),
        laborCost: Math.round(laborCost),
        consumablesCost,
        materialsTotal: Math.round(materialsTotal),
        netProductionCost: Math.round(netProductionCost),
        marginPct,
        finalBatchPrice,
        unitPrice,
        bom
    };
}

// -------------------------------------------------------------------------
// 2. ADVANCED 2D VECTOR VISUALIZER (SVG ENGINE)
// -------------------------------------------------------------------------
export function generateStudio2DSvg(calc, catalog, forPrint = false) {
    const w = parseFloat(calc.width) || 120;
    const h = parseFloat(calc.height) || 150;
    const maxW = 380;
    const maxH = 260;
    const scale = Math.min(maxW / w, maxH / h);
    const dw = Math.round(w * scale);
    const dh = Math.round(h * scale);

    const startX = Math.round(75 + (maxW - dw) / 2);
    const startY = Math.round(60 + (maxH - dh) / 2);

    // Frame profile thickness in drawing
    const ft = Math.max(10, Math.min(18, Math.round(14 * (scale / 2.2))));
    const tt = Math.max(6, Math.min(12, Math.round(8 * (scale / 2.2))));

    // Grid Columns & Rows
    let cols = 1;
    let rows = 1;
    if (calc.partitionPreset === '1x1') { cols = 1; rows = 1; }
    else if (calc.partitionPreset === '2x1') { cols = 2; rows = 1; }
    else if (calc.partitionPreset === '3x1') { cols = 3; rows = 1; }
    else if (calc.partitionPreset === '1x2') { cols = 1; rows = 2; }
    else if (calc.partitionPreset === '2x2') { cols = 2; rows = 2; }
    else if (calc.partitionPreset === '3x2') { cols = 3; rows = 2; }
    else if (calc.partitionPreset === '2x3') { cols = 2; rows = 3; }
    else {
        cols = Math.max(1, parseInt(calc.cols) || 1);
        rows = Math.max(1, parseInt(calc.rows) || 1);
    }

    // Color Theme: Print (Clean Light) vs Studio (CAD Dark)
    const bg = forPrint ? '#ffffff' : '#0f172a';
    const strokeMain = forPrint ? '#0f172a' : '#38bdf8';
    const strokeMiter = forPrint ? '#64748b' : '#0284c7';
    const frameFill = forPrint ? '#f1f5f9' : '#1e293b';
    const tubeFill = forPrint ? '#cbd5e1' : '#334155';
    const dimColor = forPrint ? '#334155' : '#94a3b8';
    const dimText = forPrint ? '#0f172a' : '#f8fafc';
    const sashStroke = forPrint ? '#b45309' : '#f59e0b';
    const sashFill = forPrint ? 'rgba(254, 243, 199, 0.4)' : 'rgba(245, 158, 11, 0.12)';
    const swingColor = forPrint ? '#d97706' : '#fbbf24';
    const handleColor = forPrint ? '#b45309' : '#f59e0b';

    // Infill / Glass Tint based on selection
    let glassFill = forPrint ? 'rgba(224, 242, 254, 0.5)' : 'rgba(56, 189, 248, 0.14)';
    if (calc.glassId === 'glass_6mm_tough') {
        glassFill = forPrint ? 'rgba(186, 230, 253, 0.65)' : 'rgba(14, 165, 233, 0.25)';
    } else if (calc.glassId === 'glass_18mm_dgu') {
        glassFill = forPrint ? 'rgba(224, 231, 255, 0.65)' : 'rgba(99, 102, 241, 0.25)';
    } else if (calc.glassId === 'glass_5mm_frosted') {
        glassFill = forPrint ? 'rgba(241, 245, 249, 0.9)' : 'rgba(255, 255, 255, 0.35)';
    } else if (calc.glassId === 'panel_acp_4mm') {
        glassFill = forPrint ? 'rgba(148, 163, 184, 0.8)' : 'rgba(71, 85, 105, 0.7)';
    }

    const uniqueId = 'cad_' + Math.floor(Math.random() * 1000000);

    // Inner aperture dimensions
    const ix = startX + ft;
    const iy = startY + ft;
    const iw = dw - 2 * ft;
    const ih = dh - 2 * ft;

    // --- Frame Variations Decor ---
    let frameVariationSvg = '';
    if (calc.profileId === 'prof_z_flange') {
        // Heavy Z-Section: Flanged perimeter with mounting lip
        frameVariationSvg = `
            <!-- Z-Flange Outer Flange Lip -->
            <rect x="${startX - 7}" y="${startY - 7}" width="${dw + 14}" height="${dh + 14}" fill="none" stroke="${strokeMain}" stroke-width="1.5" stroke-dasharray="6,4" rx="2" />
            <!-- Mounting Lugs -->
            <rect x="${startX + dw / 2 - 10}" y="${startY - 10}" width="20" height="5" fill="${strokeMain}" rx="1"/>
            <rect x="${startX + dw / 2 - 10}" y="${startY + dh + 5}" width="20" height="5" fill="${strokeMain}" rx="1"/>
            <rect x="${startX - 10}" y="${startY + dh / 2 - 10}" width="5" height="20" fill="${strokeMain}" rx="1"/>
            <rect x="${startX + dw + 5}" y="${startY + dh / 2 - 10}" width="5" height="20" fill="${strokeMain}" rx="1"/>
            <!-- Step Rebate Line -->
            <rect x="${startX + ft * 0.5}" y="${startY + ft * 0.5}" width="${dw - ft}" height="${dh - ft}" fill="none" stroke="${strokeMiter}" stroke-width="1" stroke-dasharray="3,3"/>
        `;
    } else if (calc.profileId === 'prof_step') {
        // Step Rebated Profile: Multi-layered stepped profile lines
        frameVariationSvg = `
            <rect x="${startX + ft * 0.35}" y="${startY + ft * 0.35}" width="${dw - ft * 0.7}" height="${dh - ft * 0.7}" fill="none" stroke="${strokeMiter}" stroke-width="1.2"/>
            <rect x="${startX + ft * 0.7}" y="${startY + ft * 0.7}" width="${dw - ft * 1.4}" height="${dh - ft * 1.4}" fill="none" stroke="${strokeMiter}" stroke-width="1"/>
        `;
    } else if (calc.profileId === 'prof_chamfer') {
        // Chamfered Bevel Profile: 45 degree corner chamfer accents
        const cOff = Math.round(ft * 0.7);
        frameVariationSvg = `
            <line x1="${ix}" y1="${iy + cOff}" x2="${ix + cOff}" y2="${iy}" stroke="${strokeMain}" stroke-width="2"/>
            <line x1="${ix + iw - cOff}" y1="${iy}" x2="${ix + iw}" y2="${iy + cOff}" stroke="${strokeMain}" stroke-width="2"/>
            <line x1="${ix + iw}" y1="${iy + ih - cOff}" x2="${ix + iw - cOff}" y2="${iy + ih}" stroke="${strokeMain}" stroke-width="2"/>
            <line x1="${ix + cOff}" y1="${iy + ih}" x2="${ix}" y2="${iy + ih - cOff}" stroke="${strokeMain}" stroke-width="2"/>
            <!-- Bevel Highlight -->
            <rect x="${startX + 2}" y="${startY + 2}" width="${dw - 4}" height="${dh - 4}" fill="none" stroke="${forPrint ? '#94a3b8' : '#38bdf8'}" stroke-width="0.8" opacity="0.6"/>
        `;
    } else {
        // Standard Box Profile (prof_box): Miter corner joins
        frameVariationSvg = `
            <line x1="${startX}" y1="${startY}" x2="${ix}" y2="${iy}" stroke="${strokeMiter}" stroke-width="1.5"/>
            <line x1="${startX + dw}" y1="${startY}" x2="${ix + iw}" y2="${iy}" stroke="${strokeMiter}" stroke-width="1.5"/>
            <line x1="${startX + dw}" y1="${startY + dh}" x2="${ix + iw}" y2="${iy + ih}" stroke="${strokeMiter}" stroke-width="1.5"/>
            <line x1="${startX}" y1="${startY + dh}" x2="${ix}" y2="${iy + ih}" stroke="${strokeMiter}" stroke-width="1.5"/>
        `;
    }

    // --- Inner Dividers (Square Tubes) ---
    let dividersSvg = '';
    const renderVertical = (calc.orientation === 'vertical' || calc.orientation === 'grid') && cols > 1;
    const renderHorizontal = (calc.orientation === 'horizontal' || calc.orientation === 'grid') && rows > 1;

    if (renderVertical) {
        for (let c = 1; c < cols; c++) {
            const vx = Math.round(ix + (c * iw / cols) - tt / 2);
            dividersSvg += `
                <rect x="${vx}" y="${iy}" width="${tt}" height="${ih}" fill="${tubeFill}" stroke="${strokeMain}" stroke-width="1"/>
                <line x1="${vx + tt / 2}" y1="${iy}" x2="${vx + tt / 2}" y2="${iy + ih}" stroke="${strokeMiter}" stroke-width="0.5" stroke-dasharray="4,4"/>
            `;
        }
    }

    if (renderHorizontal) {
        for (let r = 1; r < rows; r++) {
            const hy = Math.round(iy + (r * ih / rows) - tt / 2);
            dividersSvg += `
                <rect x="${ix}" y="${hy}" width="${iw}" height="${tt}" fill="${tubeFill}" stroke="${strokeMain}" stroke-width="1"/>
                <line x1="${ix}" y1="${hy + tt / 2}" x2="${ix + iw}" y2="${hy + tt / 2}" stroke="${strokeMiter}" stroke-width="0.5" stroke-dasharray="4,4"/>
            `;
        }
    }

    // --- Sash / Panel Option (പാളി) ---
    let sashSvg = '';
    if (calc.includeSash) {
        // Place sash in right pane (if cols > 1) or main pane
        const sashCol = cols > 1 ? cols - 1 : 0;
        const paneW = Math.round(iw / cols);
        const paneH = Math.round(ih / rows);
        const paneX = Math.round(ix + sashCol * paneW);
        const paneY = iy;

        const gap = 3;
        const sashT = Math.max(7, Math.min(11, Math.round(9 * (scale / 2.2))));

        const soX = paneX + gap;
        const soY = paneY + gap;
        const soW = paneW - 2 * gap;
        const soH = paneH - 2 * gap;

        const siX = soX + sashT;
        const siY = soY + sashT;
        const siW = soW - 2 * sashT;
        const siH = soH - 2 * sashT;

        // Casement swing dashed indicator
        const swingApexX = soX + soW - sashT;
        const swingApexY = soY + soH / 2;

        sashSvg = `
            <!-- Inner Sash Profile (പാളി) -->
            <rect x="${soX}" y="${soY}" width="${soW}" height="${soH}" fill="${sashFill}" stroke="${sashStroke}" stroke-width="1.8" rx="2" />
            <rect x="${siX}" y="${siY}" width="${siW}" height="${siH}" fill="${glassFill}" stroke="${sashStroke}" stroke-width="1.2" />
            
            <!-- 45-degree Sash Miter Corner lines -->
            <line x1="${soX}" y1="${soY}" x2="${siX}" y2="${siY}" stroke="${sashStroke}" stroke-width="1" />
            <line x1="${soX + soW}" y1="${soY}" x2="${siX + siW}" y2="${siY}" stroke="${sashStroke}" stroke-width="1" />
            <line x1="${soX + soW}" y1="${soY + soH}" x2="${siX + siW}" y2="${siY + siH}" stroke="${sashStroke}" stroke-width="1" />
            <line x1="${soX}" y1="${soY + soH}" x2="${siX}" y2="${siY + siH}" stroke="${sashStroke}" stroke-width="1" />

            <!-- Casement Opening Swing Lines (< or >) -->
            <path d="M ${soX + sashT} ${soY + sashT} L ${swingApexX} ${swingApexY} L ${soX + sashT} ${soY + soH - sashT}" fill="none" stroke="${swingColor}" stroke-width="1.8" stroke-dasharray="5,4" />

            <!-- Window Handle / Lock Hardware on closing stile -->
            <rect x="${swingApexX - 3}" y="${swingApexY - 12}" width="5" height="24" rx="2" fill="${handleColor}" stroke="${forPrint ? '#78350f' : '#fef3c7'}" stroke-width="1"/>
            <circle cx="${swingApexX - 0.5}" cy="${swingApexY}" r="3" fill="${forPrint ? '#78350f' : '#ffffff'}"/>

            <!-- Hinges on hinge stile -->
            <rect x="${soX - 1}" y="${soY + Math.round(soH * 0.2)}" width="3" height="14" fill="#94a3b8" rx="1"/>
            <rect x="${soX - 1}" y="${soY + Math.round(soH * 0.8) - 14}" width="3" height="14" fill="#94a3b8" rx="1"/>
            ${h > 150 ? `<rect x="${soX - 1}" y="${soY + Math.round(soH * 0.5) - 7}" width="3" height="14" fill="#94a3b8" rx="1"/>` : ''}

            <!-- Sash Malayalam badge -->
            <text x="${soX + soW / 2}" y="${soY + soH - 10}" fill="${sashStroke}" font-size="9" font-weight="700" text-anchor="middle" font-family="sans-serif">പാളി (Sash Active)</text>
        `;
    }

    return `
    <svg class="studio-cad-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 540 380" style="width: 100%; height: auto; max-height: 380px; display: block; background: ${bg}; border-radius: 8px;">
        <defs>
            <marker id="${uniqueId}_start" viewBox="0 0 10 10" refX="2" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 10 1 L 0 5 L 10 9 z" fill="${dimColor}" />
            </marker>
            <marker id="${uniqueId}_end" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M 0 1 L 10 5 L 0 9 z" fill="${dimColor}" />
            </marker>
            <!-- Blueprint grid pattern -->
            <pattern id="${uniqueId}_grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="${forPrint ? '#f1f5f9' : '#1e293b'}" stroke-width="0.8"/>
            </pattern>
        </defs>

        <!-- Technical Background Grid -->
        <rect width="540" height="380" fill="url(#${uniqueId}_grid)"/>

        <!-- Top Dimension Line & Text -->
        <line x1="${startX}" y1="32" x2="${startX + dw}" y2="32" stroke="${dimColor}" stroke-width="1.5" marker-start="url(#${uniqueId}_start)" marker-end="url(#${uniqueId}_end)"/>
        <line x1="${startX}" y1="24" x2="${startX}" y2="42" stroke="${dimColor}" stroke-width="1"/>
        <line x1="${startX + dw}" y1="24" x2="${startX + dw}" y2="42" stroke="${dimColor}" stroke-width="1"/>
        <text x="${startX + dw / 2}" y="23" fill="${dimText}" font-size="12" font-weight="700" text-anchor="middle" font-family="monospace">
            ${w} cm (${(w / 30.48).toFixed(1)} ft)
        </text>

        <!-- Left Dimension Line & Text -->
        <line x1="36" y1="${startY}" x2="36" y2="${startY + dh}" stroke="${dimColor}" stroke-width="1.5" marker-start="url(#${uniqueId}_start)" marker-end="url(#${uniqueId}_end)"/>
        <line x1="28" y1="${startY}" x2="46" y2="${startY}" stroke="${dimColor}" stroke-width="1"/>
        <line x1="28" y1="${startY + dh}" x2="46" y2="${startY + dh}" stroke="${dimColor}" stroke-width="1"/>
        <text x="24" y="${startY + dh / 2}" fill="${dimText}" font-size="12" font-weight="700" text-anchor="middle" font-family="monospace" transform="rotate(-90 24 ${startY + dh / 2})">
            ${h} cm (${(h / 30.48).toFixed(1)} ft)
        </text>

        <!-- Outer Frame Body -->
        <rect x="${startX}" y="${startY}" width="${dw}" height="${dh}" fill="${frameFill}" stroke="${strokeMain}" stroke-width="2" rx="2"/>
        
        <!-- Frame Profile Variation Graphics -->
        ${frameVariationSvg}

        <!-- Infill Aperture Glass Area -->
        <rect x="${ix}" y="${iy}" width="${iw}" height="${ih}" fill="${glassFill}" stroke="${strokeMain}" stroke-width="1.5"/>

        <!-- Dynamic Dividers (Square Tubes) -->
        ${dividersSvg}

        <!-- Optional Sash/Panel Graphic -->
        ${sashSvg}

        <!-- CAD Blueprint Watermarks / Metadata Badges -->
        <g transform="translate(16, 360)">
            <text x="0" y="0" fill="${dimColor}" font-size="9" font-weight="600" font-family="monospace">
                WINPRO 2D CAD • ${calc.itemName || 'WINDOW'} • SCALE 1:${Math.round(100 / scale)}
            </text>
        </g>
        <g transform="translate(524, 360)">
            <text x="0" y="0" fill="${dimColor}" font-size="9" font-weight="600" text-anchor="end" font-family="monospace">
                ${w}×${h}cm • ${calc.partitionPreset.toUpperCase()} • ${calc.orientation.toUpperCase()}${calc.includeSash ? ' • SASH' : ''}
            </text>
        </g>
    </svg>
    `;
}

// -------------------------------------------------------------------------
// 3. DETAILED CALCULATION STUDIO VIEW
// -------------------------------------------------------------------------
export function renderDetailedCalculation(state) {
    initStudioCalcState();
    const calc = Store.state.calcStudio;
    const catalog = Store.state.materialCatalog || [];
    const customers = Store.state.customers || [];
    const draft = Store.state.currentQuoteDraft || { items: [] };

    const breakdown = calculateStudioCostBreakdown(calc, catalog);
    const liveSvg = generateStudio2DSvg(calc, catalog, false);

    // Filter materials for selectors
    const profiles = catalog.filter(m => m.category === 'Profile');
    const tubes = catalog.filter(m => m.category === 'Square Tube');
    const glasses = catalog.filter(m => m.category === 'Glass');
    const hinges = catalog.filter(m => m.category === 'Hinges');
    const locks = catalog.filter(m => m.category === 'Lock');
    const paints = catalog.filter(m => m.category === 'Paint');

    return `
    <div style="display: flex; flex-direction: column; gap: 1.5rem; padding-bottom: 3rem;">
        
        <!-- Draft Quotation Active Session Banner -->
        ${draft.items && draft.items.length > 0 ? `
            <div style="background: linear-gradient(90deg, rgba(30, 58, 138, 0.5), rgba(15, 23, 42, 0.8)); border: 1px solid #3b82f6; border-radius: 10px; padding: 1rem 1.5rem; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 15px rgba(59, 130, 246, 0.15); flex-wrap: wrap; gap: 1rem;">
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <div style="width: 36px; height: 36px; background: #3b82f6; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white;">
                        <i data-lucide="layers" style="width: 20px; height: 20px;"></i>
                    </div>
                    <div>
                        <div style="font-weight: 700; color: white; font-size: 1rem;">
                            Quotation Draft in Progress: ${draft.items.length} Product${draft.items.length > 1 ? 's' : ''} Stored
                        </div>
                        <div style="color: #93c5fd; font-size: 0.82rem;">
                            Customer: <strong>${draft.customer || calc.customerName || 'Standard Client'}</strong> • Running Draft Total: <strong>₹${draft.items.reduce((s, it) => s + (it.total || 0), 0).toLocaleString()}</strong>
                        </div>
                    </div>
                </div>
                <div style="display: flex; gap: 0.75rem;">
                    <button onclick="window.clearCurrentDraft()" class="btn btn-secondary" style="padding: 0.5rem 0.9rem; font-size: 0.85rem; border-color: rgba(239, 68, 68, 0.4); color: #f87171;">
                        <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i> Clear Draft
                    </button>
                    <button onclick="window.saveAndGenerateQuotation()" class="btn btn-primary" style="padding: 0.5rem 1.2rem; font-size: 0.85rem; background: #22c55e; border-color: #22c55e;">
                        <i data-lucide="file-check" style="width: 14px; height: 14px;"></i> Finalize & Generate Quote
                    </button>
                </div>
            </div>
        ` : ''}

        <!-- 1. TOP SECTION: Customer Info & Product Dimensions -->
        <div class="glass-panel calc-customer-card" style="padding: 1.5rem; border-radius: 12px; position: relative; z-index: 100;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; border-bottom: 1px solid var(--glass-border); padding-bottom: 0.75rem;">
                <h3 style="margin: 0; font-size: 1.15rem; display: flex; align-items: center; gap: 0.5rem; color: var(--color-text-heading);">
                    <i data-lucide="user-check" style="color: var(--color-primary); width: 20px; height: 20px;"></i>
                    Customer Details & Specifications
                </h3>
                <span style="font-size: 0.78rem; color: var(--color-text-muted);">
                    Select an existing customer or enter new client details
                </span>
            </div>

            <!-- Customer Details Grid -->
            <div style="display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 1rem; margin-bottom: 1.25rem;">
                <div>
                    ${window.UniversalCustomerSearch ? window.UniversalCustomerSearch.renderHTML({
                        id: 'calc-customer-search',
                        label: 'Client Name*',
                        value: calc.customerName || '',
                        placeholder: 'Please select a customer name',
                        infoTooltip: 'Search verified clients, leads, and price calculation contacts'
                    }) : `
                        <label style="display: block; font-size: 0.78rem; color: var(--color-text-muted); margin-bottom: 0.35rem; font-weight: 500;">Client Name *</label>
                        <input type="text" value="${calc.customerName || ''}" oninput="window.updateStudioCalc('customerName', this.value)" class="glass-input" style="width: 100%;">
                    `}
                </div>

                <div>
                    <label style="display: block; font-size: 0.78rem; color: var(--color-text-muted); margin-bottom: 0.35rem; font-weight: 500;">
                        Location / Site Address
                    </label>
                    <input type="text" 
                           id="calc-studio-location"
                           value="${calc.customerLocation || ''}" 
                           placeholder="e.g. Kozhikode, Kerala"
                           oninput="window.updateStudioCalc('customerLocation', this.value)" 
                           class="glass-input" 
                           style="width: 100%; padding: 0.6rem; font-size: 0.88rem;">
                </div>

                <div>
                    <label style="display: block; font-size: 0.78rem; color: var(--color-text-muted); margin-bottom: 0.35rem; font-weight: 500;">
                        Phone Number
                    </label>
                    <input type="text" 
                           id="calc-studio-phone"
                           value="${calc.customerPhone || ''}" 
                           placeholder="e.g. 9846112233"
                           oninput="window.updateStudioCalc('customerPhone', this.value)" 
                           class="glass-input" 
                           style="width: 100%; padding: 0.6rem; font-size: 0.88rem;">
                </div>
            </div>

            <!-- Product Identity & Size Grid -->
            <div style="display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 1rem; align-items: end; background: var(--input-bg); padding: 1rem; border-radius: 8px; border: 1px solid var(--glass-border);">
                <div>
                    <label style="display: block; font-size: 0.78rem; color: var(--color-text-muted); margin-bottom: 0.35rem; font-weight: 500;">
                        Product / Window Description
                    </label>
                    <input type="text" 
                           value="${calc.itemName || 'Window W1'}" 
                           placeholder="e.g. Window W1 - Master Bedroom"
                           oninput="window.updateStudioCalc('itemName', this.value)" 
                           class="glass-input" 
                           style="width: 100%; padding: 0.6rem; font-size: 0.88rem;">
                </div>

                <div>
                    <label style="display: block; font-size: 0.78rem; color: var(--color-text-muted); margin-bottom: 0.35rem; font-weight: 500;">
                        Width (cm) <span style="color: var(--color-primary); font-size: 0.72rem;">(${(calc.width / 30.48).toFixed(1)} ft)</span>
                    </label>
                    <input type="number" 
                           value="${calc.width}" 
                           step="1"
                           min="30"
                           max="600"
                           oninput="window.updateStudioCalc('width', this.value)" 
                           class="glass-input" 
                           style="width: 100%; padding: 0.6rem; font-size: 0.88rem; font-weight: 700;">
                </div>

                <div>
                    <label style="display: block; font-size: 0.78rem; color: var(--color-text-muted); margin-bottom: 0.35rem; font-weight: 500;">
                        Height (cm) <span style="color: var(--color-primary); font-size: 0.72rem;">(${(calc.height / 30.48).toFixed(1)} ft)</span>
                    </label>
                    <input type="number" 
                           value="${calc.height}" 
                           step="1"
                           min="30"
                           max="600"
                           oninput="window.updateStudioCalc('height', this.value)" 
                           class="glass-input" 
                           style="width: 100%; padding: 0.6rem; font-size: 0.88rem; font-weight: 700;">
                </div>

                <div>
                    <label style="display: block; font-size: 0.78rem; color: var(--color-text-muted); margin-bottom: 0.35rem; font-weight: 500;">
                        Quantity (Units)
                    </label>
                    <input type="number" 
                           value="${calc.quantity || 1}" 
                           min="1"
                           max="100"
                           oninput="window.updateStudioCalc('quantity', this.value)" 
                           class="glass-input" 
                           style="width: 100%; padding: 0.6rem; font-size: 0.88rem; font-weight: 700; text-align: center;">
                </div>
            </div>
        </div>

        <!-- 2. WORKSPACE SECTION: Global Partition Control + 2D Dynamic Visualizer -->
        <div style="display: grid; grid-template-columns: 360px 1fr; gap: 1.5rem; align-items: start;">
            
            <!-- LEFT CONTROL COLUMN: Global Partition & Material Catalog Selection -->
            <div class="glass-panel" style="padding: 1.25rem; border-radius: 12px; display: flex; flex-direction: column; gap: 1.25rem;">
                
                <!-- Global Partition Control Column -->
                <div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.65rem;">
                        <label style="font-size: 0.82rem; font-weight: 700; color: var(--color-text-heading); text-transform: uppercase; letter-spacing: 0.5px; display: flex; align-items: center; gap: 0.4rem;">
                            <i data-lucide="grid" style="width: 15px; height: 15px; color: var(--color-primary);"></i>
                            Global Partition Control
                        </label>
                        <span style="font-size: 0.72rem; color: var(--color-text-muted);">Preset: <strong>${calc.partitionPreset.toUpperCase()}</strong></span>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.4rem;">
                        ${[
                            { id: '1x1', label: '1x1', desc: 'Single' },
                            { id: '2x1', label: '2x1', desc: '2 Col' },
                            { id: '3x1', label: '3x1', desc: '3 Col' },
                            { id: '1x2', label: '1x2', desc: '2 Row' },
                            { id: '2x2', label: '2x2', desc: '4 Grid' },
                            { id: '3x2', label: '3x2', desc: '6 Grid' },
                            { id: '2x3', label: '2x3', desc: '6 Tier' },
                            { id: 'custom', label: 'Custom', desc: 'Manual' }
                        ].map(p => `
                            <button onclick="window.setStudioPartition('${p.id}')"
                                    class="calc-partition-btn ${calc.partitionPreset === p.id ? 'active' : ''}"
                                    style="border-radius: 6px; padding: 6px 4px; font-size: 0.78rem; cursor: pointer; text-align: center; transition: all 0.15s; border: 1px solid ${calc.partitionPreset === p.id ? 'var(--color-primary)' : 'var(--glass-border)'}; background: ${calc.partitionPreset === p.id ? 'var(--color-primary)' : 'var(--input-bg)'}; color: ${calc.partitionPreset === p.id ? 'white' : 'var(--color-text-main)'};">
                                <div style="font-weight: 700;">${p.label}</div>
                                <div style="font-size: 0.68rem; opacity: 0.75;">${p.desc}</div>
                            </button>
                        `).join('')}
                    </div>

                    ${calc.partitionPreset === 'custom' ? `
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-top: 0.6rem; padding: 0.6rem; background: var(--input-bg); border-radius: 6px; border: 1px solid var(--glass-border);">
                            <div>
                                <label style="font-size: 0.7rem; color: var(--color-text-muted);">Columns</label>
                                <input type="number" min="1" max="8" value="${calc.cols || 2}" oninput="window.updateStudioCalc('cols', this.value)" class="glass-input" style="width: 100%; padding: 4px; font-size: 0.8rem;">
                            </div>
                            <div>
                                <label style="font-size: 0.7rem; color: var(--color-text-muted);">Rows</label>
                                <input type="number" min="1" max="8" value="${calc.rows || 1}" oninput="window.updateStudioCalc('rows', this.value)" class="glass-input" style="width: 100%; padding: 4px; font-size: 0.8rem;">
                            </div>
                        </div>
                    ` : ''}
                </div>

                <!-- Orientation Control -->
                <div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                        <label style="font-size: 0.82rem; font-weight: 700; color: var(--color-text-heading); text-transform: uppercase; letter-spacing: 0.5px; display: flex; align-items: center; gap: 0.4rem;">
                            <i data-lucide="compass" style="width: 15px; height: 15px; color: var(--color-primary);"></i>
                            Tube Orientation
                        </label>
                        <span style="font-size: 0.72rem; color: var(--color-text-muted); text-transform: capitalize;">${calc.orientation}</span>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.4rem;">
                        <button onclick="window.setStudioOrientation('vertical')"
                                style="border: 1px solid ${calc.orientation === 'vertical' ? 'var(--color-primary)' : 'var(--glass-border)'};
                                       background: ${calc.orientation === 'vertical' ? 'var(--color-primary-subtle)' : 'var(--input-bg)'};
                                       color: ${calc.orientation === 'vertical' ? 'var(--color-primary)' : 'var(--color-text-main)'};
                                       border-radius: 6px; padding: 7px 4px; font-size: 0.78rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px; font-weight: 600;">
                            <i data-lucide="split" style="width: 14px; height: 14px;"></i> Vertical
                        </button>

                        <button onclick="window.setStudioOrientation('horizontal')"
                                style="border: 1px solid ${calc.orientation === 'horizontal' ? 'var(--color-primary)' : 'var(--glass-border)'};
                                       background: ${calc.orientation === 'horizontal' ? 'var(--color-primary-subtle)' : 'var(--input-bg)'};
                                       color: ${calc.orientation === 'horizontal' ? 'var(--color-primary)' : 'var(--color-text-main)'};
                                       border-radius: 6px; padding: 7px 4px; font-size: 0.78rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px; font-weight: 600;">
                            <i data-lucide="rows" style="width: 14px; height: 14px;"></i> Horizontal
                        </button>

                        <button onclick="window.setStudioOrientation('grid')"
                                style="border: 1px solid ${calc.orientation === 'grid' ? 'var(--color-primary)' : 'var(--glass-border)'};
                                       background: ${calc.orientation === 'grid' ? 'var(--color-primary-subtle)' : 'var(--input-bg)'};
                                       color: ${calc.orientation === 'grid' ? 'var(--color-primary)' : 'var(--color-text-main)'};
                                       border-radius: 6px; padding: 7px 4px; font-size: 0.78rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px; font-weight: 600;">
                            <i data-lucide="grid" style="width: 14px; height: 14px;"></i> Both Grid
                        </button>
                    </div>
                </div>

                <!-- Sash / Panel Toggle (പാളി) -->
                <div style="background: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 8px; padding: 0.85rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <div style="font-weight: 700; color: #f59e0b; font-size: 0.88rem; display: flex; align-items: center; gap: 0.4rem;">
                                <i data-lucide="door-open" style="width: 16px; height: 16px;"></i>
                                Include Sash / Panel (പാളി)
                            </div>
                            <div style="font-size: 0.72rem; color: var(--color-text-muted); margin-top: 2px;">
                                Draws opening inner sash profile, hinges & lock handle
                            </div>
                        </div>
                        <label style="position: relative; display: inline-block; width: 44px; height: 24px; margin: 0; cursor: pointer;">
                            <input type="checkbox" 
                                   ${calc.includeSash ? 'checked' : ''} 
                                   onchange="window.toggleStudioSash(this.checked)"
                                   style="opacity: 0; width: 0; height: 0;">
                            <span style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: ${calc.includeSash ? '#f59e0b' : 'var(--glass-border)'}; transition: .3s; border-radius: 24px;"></span>
                            <span style="position: absolute; content: ''; height: 18px; width: 18px; left: ${calc.includeSash ? '23px' : '3px'}; bottom: 3px; background-color: white; transition: .3s; border-radius: 50%;"></span>
                        </label>
                    </div>
                </div>

                <!-- Material Catalog Component Dropdowns -->
                <div style="display: flex; flex-direction: column; gap: 0.75rem; border-top: 1px solid var(--glass-border); padding-top: 1rem;">
                    <div style="font-size: 0.82rem; font-weight: 700; color: var(--color-text-heading); text-transform: uppercase; letter-spacing: 0.5px; display: flex; align-items: center; gap: 0.4rem;">
                        <i data-lucide="layers" style="width: 15px; height: 15px; color: var(--color-accent);"></i>
                        Material Catalog Specifications
                    </div>

                    <!-- Profile Type (Frame Variation) -->
                    <div>
                        <label style="display: block; font-size: 0.74rem; color: var(--color-text-muted); margin-bottom: 0.25rem;">
                            Profile Type (Outer Frame Variation)
                        </label>
                        <select onchange="window.updateStudioCalc('profileId', this.value)" class="glass-input" style="width: 100%; padding: 0.45rem; font-size: 0.82rem;">
                            ${profiles.map(p => `
                                <option value="${p.id}" ${p.id === calc.profileId ? 'selected' : ''}>
                                    ${p.name} (₹${p.rate}/${p.unit})
                                </option>
                            `).join('')}
                        </select>
                    </div>

                    <!-- Square Tube Type -->
                    <div>
                        <label style="display: block; font-size: 0.74rem; color: var(--color-text-muted); margin-bottom: 0.25rem;">
                            Square Tube Type (Inner Partition & Sash)
                        </label>
                        <select onchange="window.updateStudioCalc('tubeId', this.value)" class="glass-input" style="width: 100%; padding: 0.45rem; font-size: 0.82rem;">
                            ${tubes.map(t => `
                                <option value="${t.id}" ${t.id === calc.tubeId ? 'selected' : ''}>
                                    ${t.name} (₹${t.rate}/${t.unit})
                                </option>
                            `).join('')}
                        </select>
                    </div>

                    <!-- Panel / Glass Spec -->
                    <div>
                        <label style="display: block; font-size: 0.74rem; color: var(--color-text-muted); margin-bottom: 0.25rem;">
                            Panel / Glass Spec (Infill Material)
                        </label>
                        <select onchange="window.updateStudioCalc('glassId', this.value)" class="glass-input" style="width: 100%; padding: 0.45rem; font-size: 0.82rem;">
                            ${glasses.map(g => `
                                <option value="${g.id}" ${g.id === calc.glassId ? 'selected' : ''}>
                                    ${g.name} (₹${g.rate}/${g.unit})
                                </option>
                            `).join('')}
                        </select>
                    </div>

                    <!-- Hinges -->
                    <div>
                        <label style="display: block; font-size: 0.74rem; color: var(--color-text-muted); margin-bottom: 0.25rem;">
                            Hinges (For Sash Opening)
                        </label>
                        <select onchange="window.updateStudioCalc('hingeId', this.value)" class="glass-input" style="width: 100%; padding: 0.45rem; font-size: 0.82rem;">
                            ${hinges.map(h => `
                                <option value="${h.id}" ${h.id === calc.hingeId ? 'selected' : ''}>
                                    ${h.name} (₹${h.rate}/${h.unit})
                                </option>
                            `).join('')}
                        </select>
                    </div>

                    <!-- Lock Type -->
                    <div>
                        <label style="display: block; font-size: 0.74rem; color: var(--color-text-muted); margin-bottom: 0.25rem;">
                            Lock Type & Handle
                        </label>
                        <select onchange="window.updateStudioCalc('lockId', this.value)" class="glass-input" style="width: 100%; padding: 0.45rem; font-size: 0.82rem;">
                            ${locks.map(l => `
                                <option value="${l.id}" ${l.id === calc.lockId ? 'selected' : ''}>
                                    ${l.name} (₹${l.rate}/${l.unit})
                                </option>
                            `).join('')}
                        </select>
                    </div>

                    <!-- Paint / Finish -->
                    <div>
                        <label style="display: block; font-size: 0.74rem; color: var(--color-text-muted); margin-bottom: 0.25rem;">
                            Coating / Finish
                        </label>
                        <select onchange="window.updateStudioCalc('paintId', this.value)" class="glass-input" style="width: 100%; padding: 0.45rem; font-size: 0.82rem;">
                            ${paints.map(pt => `
                                <option value="${pt.id}" ${pt.id === calc.paintId ? 'selected' : ''}>
                                    ${pt.name} (₹${pt.rate}/${pt.unit})
                                </option>
                            `).join('')}
                        </select>
                    </div>
                </div>

            </div>

            <!-- RIGHT COLUMN: 2D Dynamic Visualizer Canvas -->
            <div class="glass-panel" style="padding: 1.5rem; border-radius: 12px; display: flex; flex-direction: column; justify-content: space-between;">
                
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; border-bottom: 1px solid var(--glass-border); padding-bottom: 0.75rem;">
                    <div>
                        <h3 style="margin: 0; font-size: 1.15rem; display: flex; align-items: center; gap: 0.5rem; color: var(--color-text-heading);">
                            <i data-lucide="eye" style="color: var(--color-primary); width: 20px; height: 20px;"></i>
                            Interactive 2D Visualizer
                        </h3>
                        <p style="margin: 2px 0 0; font-size: 0.78rem; color: var(--color-text-muted);">
                            Real-time scaled engineering blueprint rendering with material variations and opening kinematics
                        </p>
                    </div>
                    <div style="display: flex; gap: 0.5rem; align-items: center;">
                        <span style="padding: 3px 10px; background: rgba(56, 189, 248, 0.15); border: 1px solid rgba(56, 189, 248, 0.3); color: #0284c7; border-radius: 20px; font-size: 0.75rem; font-weight: 600;">
                            ${calc.width} × ${calc.height} cm
                        </span>
                        <span style="padding: 3px 10px; background: rgba(34, 197, 94, 0.15); border: 1px solid rgba(34, 197, 94, 0.3); color: #059669; border-radius: 20px; font-size: 0.75rem; font-weight: 600;">
                            ${breakdown.area_sq_ft.toFixed(1)} sq.ft
                        </span>
                    </div>
                </div>

                <!-- SVG Visualizer Container -->
                <div class="calc-svg-wrapper" style="background: var(--color-bg-card); border: 1px solid var(--glass-border); border-radius: 10px; overflow: hidden; box-shadow: inset 0 2px 10px rgba(0,0,0,0.1); padding: 0.5rem; display: flex; align-items: center; justify-content: center; min-height: 380px;">
                    ${liveSvg}
                </div>

                <!-- Visualizer Spec Badges Bar -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 0.6rem; margin-top: 1rem;">
                    <div class="calc-spec-badge" style="background: var(--input-bg); border: 1px solid var(--glass-border); border-radius: 6px; padding: 0.6rem 0.8rem;">
                        <span style="display: block; font-size: 0.68rem; color: var(--color-text-muted); text-transform: uppercase;">Frame Profile</span>
                        <strong style="font-size: 0.8rem; color: var(--color-text-heading); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block;">${breakdown.profile.name}</strong>
                    </div>

                    <div class="calc-spec-badge" style="background: var(--input-bg); border: 1px solid var(--glass-border); border-radius: 6px; padding: 0.6rem 0.8rem;">
                        <span style="display: block; font-size: 0.68rem; color: var(--color-text-muted); text-transform: uppercase;">Inner Tube</span>
                        <strong style="font-size: 0.8rem; color: var(--color-text-heading); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block;">${breakdown.tube.name}</strong>
                    </div>

                    <div class="calc-spec-badge" style="background: var(--input-bg); border: 1px solid var(--glass-border); border-radius: 6px; padding: 0.6rem 0.8rem;">
                        <span style="display: block; font-size: 0.68rem; color: var(--color-text-muted); text-transform: uppercase;">Glazing Spec</span>
                        <strong style="font-size: 0.8rem; color: var(--color-text-heading); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block;">${breakdown.glass.name}</strong>
                    </div>

                    <div class="calc-spec-badge" style="background: var(--input-bg); border: 1px solid var(--glass-border); border-radius: 6px; padding: 0.6rem 0.8rem;">
                        <span style="display: block; font-size: 0.68rem; color: var(--color-text-muted); text-transform: uppercase;">Sash State</span>
                        <strong style="font-size: 0.8rem; color: ${calc.includeSash ? '#f59e0b' : 'var(--color-text-muted)'};">${calc.includeSash ? 'Active (പാളി)' : 'Fixed Frame'}</strong>
                    </div>
                </div>

            </div>
        </div>

        <!-- 3. DETAILED COST BREAKDOWN: Profile Section Details Table -->
        <div class="glass-panel" style="padding: 1.5rem; border-radius: 12px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; border-bottom: 1px solid var(--glass-border); padding-bottom: 0.75rem;">
                <div>
                    <h3 style="margin: 0; font-size: 1.15rem; display: flex; align-items: center; gap: 0.5rem; color: var(--color-text-heading);">
                        <i data-lucide="calculator" style="color: var(--color-success); width: 20px; height: 20px;"></i>
                        Profile Section Details (Detailed Cost Breakdown)
                    </h3>
                    <p style="margin: 2px 0 0; font-size: 0.78rem; color: var(--color-text-muted);">
                        Auto-calculated from Material Catalog prices, specific units of measurement (kg / pcs / ltr / sq.ft), and fabrication parameters
                    </p>
                </div>
                
                <div style="display: flex; align-items: center; gap: 0.5rem; background: var(--input-bg); padding: 4px 10px; border-radius: 6px; border: 1px solid var(--glass-border);">
                    <span style="font-size: 0.78rem; color: var(--color-text-muted);">Profit Margin:</span>
                    <input type="number" 
                           value="${calc.marginPct || 20}" 
                           min="0" 
                           max="100" 
                           oninput="window.updateStudioCalc('marginPct', this.value)"
                           class="glass-input" 
                           style="width: 50px; padding: 2px 4px; font-size: 0.82rem; text-align: center; color: #10b981; font-weight: 700;">
                    <span style="font-size: 0.78rem; color: #10b981; font-weight: 700;">%</span>
                </div>
            </div>

            <!-- Profile Section Details Table -->
            <div style="background: var(--input-bg); border-radius: 8px; border: 1px solid var(--glass-border); overflow-x: auto; margin-bottom: 1.5rem;">
                <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.88rem;">
                    <thead>
                        <tr style="background: var(--table-sticky-header-bg); border-bottom: 1px solid var(--glass-border); color: var(--color-text-muted); font-size: 0.78rem; text-transform: uppercase;">
                            <th style="padding: 10px 14px;">#</th>
                            <th style="padding: 10px 14px;">Material Component</th>
                            <th style="padding: 10px 14px;">Specification / Grade</th>
                            <th style="padding: 10px 14px; text-align: center;">Required Quantity & UoM</th>
                            <th style="padding: 10px 14px; text-align: right;">Unit Cost (₹)</th>
                            <th style="padding: 10px 14px; text-align: right;">Total Cost (₹)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${breakdown.bom.map((b, idx) => `
                            <tr style="border-bottom: 1px solid var(--glass-border); transition: background 0.15s;" onmouseover="this.style.background='var(--color-bg-card-hover)'" onmouseout="this.style.background='transparent'">
                                <td style="padding: 9px 14px; color: var(--color-text-subtle); font-size: 0.78rem;">${idx + 1}</td>
                                <td style="padding: 9px 14px; font-weight: 600; color: var(--color-text-heading);">${b.component}</td>
                                <td style="padding: 9px 14px; color: var(--color-text-muted); font-size: 0.82rem;">${b.spec}</td>
                                <td style="padding: 9px 14px; text-align: center;">
                                    <span style="background: var(--color-primary-subtle); border: 1px solid var(--color-primary-border); color: var(--color-primary); padding: 2px 8px; border-radius: 4px; font-size: 0.82rem; font-weight: 600; font-family: monospace;">
                                        ${b.requiredUnit}
                                    </span>
                                </td>
                                <td style="padding: 9px 14px; text-align: right; color: var(--color-text-main);">₹${b.rate} <span style="font-size: 0.72rem; color: var(--color-text-muted);">/${b.uom}</span></td>
                                <td style="padding: 9px 14px; text-align: right; font-weight: 700; color: var(--color-text-heading);">₹${b.amount.toLocaleString()}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>

            <!-- Pricing Summary Cards & Action Bar -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)) 380px; gap: 1.5rem; align-items: center; border-top: 1px solid var(--glass-border); padding-top: 1.25rem;">
                
                <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
                    <div style="background: var(--input-bg); border: 1px solid var(--glass-border); padding: 0.8rem 1rem; border-radius: 8px;">
                        <span style="font-size: 0.72rem; color: var(--color-text-muted); text-transform: uppercase;">Raw Materials Subtotal</span>
                        <div style="font-size: 1.15rem; font-weight: 700; color: var(--color-text-heading);">₹${breakdown.materialsTotal.toLocaleString()}</div>
                    </div>

                    <div style="background: var(--input-bg); border: 1px solid var(--glass-border); padding: 0.8rem 1rem; border-radius: 8px;">
                        <span style="font-size: 0.72rem; color: var(--color-text-muted); text-transform: uppercase;">Fabrication & Labor</span>
                        <div style="font-size: 1.15rem; font-weight: 700; color: var(--color-text-heading);">₹${breakdown.laborCost.toLocaleString()}</div>
                    </div>

                    <div style="background: var(--input-bg); border: 1px solid var(--glass-border); padding: 0.8rem 1rem; border-radius: 8px;">
                        <span style="font-size: 0.72rem; color: var(--color-text-muted); text-transform: uppercase;">Net Cost per Unit</span>
                        <div style="font-size: 1.15rem; font-weight: 700; color: var(--color-text-heading);">₹${Math.round(breakdown.netProductionCost / (calc.quantity || 1)).toLocaleString()}</div>
                    </div>
                </div>

                <!-- Final Quotation Price Card & Action Buttons -->
                <div style="background: linear-gradient(135deg, rgba(34, 197, 94, 0.12), var(--color-bg-card)); border: 1px solid rgba(34, 197, 94, 0.4); border-radius: 10px; padding: 1.2rem; display: flex; flex-direction: column; gap: 0.8rem;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-end;">
                        <div>
                            <span style="font-size: 0.75rem; color: var(--color-success); text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">Quotation Price (Total Batch)</span>
                            <div style="font-size: 1.7rem; font-weight: 800; color: var(--color-success); line-height: 1.1;">
                                ₹${breakdown.finalBatchPrice.toLocaleString()}
                            </div>
                        </div>
                        <div style="text-align: right; font-size: 0.82rem; color: var(--color-success);">
                            ₹${breakdown.unitPrice.toLocaleString()} <span style="font-size: 0.72rem;">/ unit (x${calc.quantity})</span>
                        </div>
                    </div>

                    <!-- 4. QUOTATION GENERATION & SAVE BUTTONS -->
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.6rem; margin-top: 0.2rem;">
                        <!-- Save & New Button -->
                        <button onclick="window.saveAndNewCalculation()" 
                                class="btn btn-secondary" 
                                style="padding: 0.7rem 0.8rem; font-size: 0.85rem; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 0.4rem; border-color: var(--color-primary); color: var(--color-primary);"
                                title="Saves current product calculation in background and resets window for product #2">
                            <i data-lucide="plus-circle" style="width: 16px; height: 16px;"></i>
                            Save & New
                        </button>

                        <!-- Save Button (Generates full Quotation with exact 2D designs) -->
                        <button onclick="window.saveAndGenerateQuotation()" 
                                class="btn btn-primary" 
                                style="padding: 0.7rem 0.8rem; font-size: 0.85rem; font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 0.4rem; background: #22c55e; border-color: #22c55e; box-shadow: 0 4px 15px rgba(34, 197, 94, 0.4);"
                                title="Finalizes quotation with 2D drawings and opens print/view document">
                            <i data-lucide="check-circle" style="width: 16px; height: 16px;"></i>
                            Save (Generate Quote)
                        </button>
                    </div>
                </div>

            </div>
        </div>

    </div>
    `;
}

// -------------------------------------------------------------------------
// 4. WINDOW ACTION HANDLERS FOR DETAILED CALCULATION
// -------------------------------------------------------------------------
window.updateStudioCalc = (field, value) => {
    initStudioCalcState();
    const c = Store.state.calcStudio;
    if (['width', 'height', 'quantity', 'cols', 'rows', 'marginPct'].includes(field)) {
        c[field] = parseFloat(value) || 0;
    } else {
        c[field] = value;
    }
    // Auto-save customer to global customer list if name is provided
    if (field === 'customerName' && value && value.trim().length >= 2) {
        Store.ensureCustomerFromCalculation({
            name: value.trim(),
            phone: c.customerPhone || '',
            location: c.customerLocation || ''
        });
    } else if (['customerPhone', 'customerLocation'].includes(field) && c.customerName && c.customerName.trim().length >= 2) {
        Store.ensureCustomerFromCalculation({
            name: c.customerName.trim(),
            phone: c.customerPhone || '',
            location: c.customerLocation || ''
        });
    }
    Store.notify();
};

window.selectStudioCustomer = (cust) => {
    initStudioCalcState();
    const c = Store.state.calcStudio;
    if (typeof cust === 'string') {
        const found = (Store.state.customers || []).find(it => it.id === cust || (it.name && it.name.toLowerCase() === cust.trim().toLowerCase()));
        cust = found || { name: cust };
    }
    if (cust && cust.name) {
        c.customerId = cust.id || '';
        c.customerName = cust.name;
        c.customerLocation = cust.address || cust.location || '';
        c.customerPhone = cust.mobile || cust.phone || '';
        // Ensure registered in global customer list
        Store.ensureCustomerFromCalculation({
            id: c.customerId,
            name: c.customerName,
            phone: c.customerPhone,
            location: c.customerLocation
        });
    } else {
        c.customerId = '';
        c.customerName = '';
        c.customerLocation = '';
        c.customerPhone = '';
    }
    Store.notify();
};

window.setStudioPartition = (preset) => {
    initStudioCalcState();
    const c = Store.state.calcStudio;
    c.partitionPreset = preset;
    if (preset === '1x1') { c.cols = 1; c.rows = 1; }
    else if (preset === '2x1') { c.cols = 2; c.rows = 1; }
    else if (preset === '3x1') { c.cols = 3; c.rows = 1; }
    else if (preset === '1x2') { c.cols = 1; c.rows = 2; }
    else if (preset === '2x2') { c.cols = 2; c.rows = 2; }
    else if (preset === '3x2') { c.cols = 3; c.rows = 2; }
    else if (preset === '2x3') { c.cols = 2; c.rows = 3; }
    Store.notify();
};

window.setStudioOrientation = (orient) => {
    initStudioCalcState();
    Store.state.calcStudio.orientation = orient;
    Store.notify();
};

window.toggleStudioSash = (checked) => {
    initStudioCalcState();
    Store.state.calcStudio.includeSash = !!checked;
    Store.notify();
};

// -------------------------------------------------------------------------
// 5. 'SAVE & NEW' AND 'SAVE' (GENERATE QUOTATION) LOGIC
// -------------------------------------------------------------------------
window.saveAndNewCalculation = () => {
    initStudioCalcState();
    const calc = Store.state.calcStudio;
    const catalog = Store.state.materialCatalog || [];

    const clientName = (calc.customerName || '').trim();
    if (!clientName) {
        alert('Please enter or select a Client Name before saving.');
        return;
    }

    // Auto-save customer to global customer list so they are immediately searchable
    Store.ensureCustomerFromCalculation({
        id: calc.customerId,
        name: clientName,
        phone: calc.customerPhone || '',
        location: calc.customerLocation || ''
    });

    const breakdown = calculateStudioCostBreakdown(calc, catalog);
    // Generate clean vector SVG for quotation document
    const drawingSvg = generateStudio2DSvg(calc, catalog, true);

    const newItem = {
        id: 'prod_' + Date.now(),
        name: calc.itemName || `Window (${calc.width}x${calc.height}cm)`,
        desc: `${calc.width}x${calc.height}cm • ${breakdown.profile.name} • ${calc.partitionPreset.toUpperCase()} ${calc.orientation.toUpperCase()}${calc.includeSash ? ' (പാളി / Sash)' : ''}`,
        width: calc.width,
        height: calc.height,
        pieces: parseInt(calc.quantity) || 1,
        rate: breakdown.unitPrice,
        total: breakdown.finalBatchPrice,
        drawingSvg: drawingSvg,
        bom: breakdown.bom
    };

    // Save client info to session draft
    Store.state.currentQuoteDraft.customer = clientName;
    Store.state.currentQuoteDraft.customerId = calc.customerId || '';
    Store.state.currentQuoteDraft.customerPhone = calc.customerPhone || '';
    Store.state.currentQuoteDraft.customerAddress = calc.customerLocation || '';
    Store.addDraftQuoteItem(newItem);

    // Auto-advance product name for Product #2 while keeping customer intact
    const currentName = calc.itemName || 'Window W1';
    const match = currentName.match(/^(.*?)(\d+)$/);
    if (match) {
        calc.itemName = `${match[1]}${parseInt(match[2]) + 1}`;
    } else {
        calc.itemName = `Window W${Store.state.currentQuoteDraft.items.length + 1}`;
    }

    alert(`✅ Product "${newItem.name}" saved to quotation draft!\nTotal items in draft: ${Store.state.currentQuoteDraft.items.length}.\nYou can now configure and calculate Product #${Store.state.currentQuoteDraft.items.length + 1}.`);
    Store.notify();
};

window.saveAndGenerateQuotation = () => {
    initStudioCalcState();
    const calc = Store.state.calcStudio;
    const catalog = Store.state.materialCatalog || [];

    const clientName = (calc.customerName || '').trim();
    if (!clientName) {
        alert('Please enter or select a Client Name to generate a quotation.');
        return;
    }

    // Auto-save customer to global customer list so they are immediately searchable
    Store.ensureCustomerFromCalculation({
        id: calc.customerId,
        name: clientName,
        phone: calc.customerPhone || '',
        location: calc.customerLocation || ''
    });

    const breakdown = calculateStudioCostBreakdown(calc, catalog);
    const drawingSvg = generateStudio2DSvg(calc, catalog, true);

    const currentItem = {
        id: 'prod_' + Date.now(),
        name: calc.itemName || `Window (${calc.width}x${calc.height}cm)`,
        desc: `${calc.width}x${calc.height}cm • ${breakdown.profile.name} • ${calc.partitionPreset.toUpperCase()} ${calc.orientation.toUpperCase()}${calc.includeSash ? ' (പാളി / Sash)' : ''}`,
        width: calc.width,
        height: calc.height,
        pieces: parseInt(calc.quantity) || 1,
        rate: breakdown.unitPrice,
        total: breakdown.finalBatchPrice,
        drawingSvg: drawingSvg,
        bom: breakdown.bom
    };

    // Combine any previously saved draft items with the current product
    let finalItems = [...(Store.state.currentQuoteDraft.items || [])];
    finalItems.push(currentItem);

    const totalAmount = finalItems.reduce((sum, it) => sum + (it.total || 0), 0);
    const quoteId = `Q-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const today = new Date().toISOString().split('T')[0];
    const dueDate = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

    const newQuotation = {
        id: quoteId,
        customer: clientName,
        customerPhone: calc.customerPhone || '',
        customerAddress: calc.customerLocation || '',
        date: today,
        dueDate: dueDate,
        amount: totalAmount,
        status: 'Draft',
        salesPerson: { name: (Store.state.user && Store.state.user.name) || 'Admin', contact: '+91 9846 123 456' },
        paymentTerms: '50% Advance, Balance before delivery.',
        validity: '30 Days',
        description: `Customized 2D architectural calculation package with ${finalItems.length} product specification${finalItems.length > 1 ? 's' : ''}.`,
        items: finalItems
    };

    if (!Store.state.quotations) Store.state.quotations = [];
    Store.state.quotations.unshift(newQuotation);

    // Clear draft session
    Store.clearDraftQuote();
    Store.saveState();

    // Advance to next window name for future calculations
    calc.itemName = `Window W${finalItems.length + 1}`;

    // Switch view to Quotations and launch the Print document modal showing exact 2D designs
    Store.state.currentView = 'quotations';
    Store.notify();

    setTimeout(() => {
        if (window.openPrintQuotationModal) {
            window.openPrintQuotationModal(newQuotation);
        }
    }, 120);
};

window.clearCurrentDraft = () => {
    if (confirm('Clear current quotation draft and discard unsaved products?')) {
        Store.clearDraftQuote();
        Store.notify();
    }
};


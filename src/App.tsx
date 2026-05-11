import React, { useState, useEffect, useRef } from 'react';

const DEMO_INTEL = `THREAT_ID: BIO-2026-Δ7-K103
THREAT_CLASS: Engineered NNRTI-resistant HIV-1 RT variant
TARGET_PROTEIN: HIV-1 Reverse Transcriptase (p66/p51)
CANDIDATE_SCAFFOLD: CC1=CC(=CC(=C1)C(F)(F)F)N2CC(C(=O)N2)
NC3=CC=CC=C3
KNOWN_RESISTANCE: K103N, E138K, V179D triple mutation
URGENCY_TIER: CRITICAL
VULNERABILITY_WINDOW: 72 hours
POPULATION_AT_RISK: 10,000+ projected
RECOMMENDED_ACTION: Scaffold bulkier R-groups, target NNRTI pocket`;

const DEMO_SYNTH = `--- COMPOUND 1 ---
ID: HELIX-FORGE-001
SMILES: CC1=CC(=CC(=C1)C(F)(F)F)N2CC(C(=O)N2)NC3=CC=C(C=C3)Cl
R_GROUP_MOD: Fluorine at para-chlorophenyl; overcomes V179D clash
PRED_BINDING: -9.47 kcal/mol
ADMET_FLAGS: CYP3A4 moderate — ACCEPTABLE
SYNTHESIS_STEPS: 6
PRIORITY: HIGH
--- COMPOUND 2 ---
ID: HELIX-FORGE-002
SMILES: CN1CCN(CC1)C2=CC(=NC3=CC=CC=C23)NC4=CC=C(C=C4)C(F)(F)F
R_GROUP_MOD: Piperazine linker; improves solubility
PRED_BINDING: -8.93 kcal/mol
ADMET_FLAGS: hERG moderate — MONITOR
SYNTHESIS_STEPS: 7
PRIORITY: MEDIUM
--- COMPOUND 3 ---
ID: HELIX-FORGE-003
SMILES: C1CN(CCO1)C2=NC3=CC=CC=C3C(=N2)NC4=CC=C(C=C4)Cl
R_GROUP_MOD: Morpholine ring; oral bioavailability improved
PRED_BINDING: -8.61 kcal/mol
ADMET_FLAGS: AMES negative — CLEAN
SYNTHESIS_STEPS: 5
PRIORITY: MEDIUM
LEAD_RECOMMENDATION: HELIX-FORGE-001 highest binding, clean ADMET
REQUIRED_PRECURSORS: 4-chloro-2-fluoroaniline, 
3,5-bis(trifluoromethyl)benzaldehyde, glycine ethyl ester HCl, 
HATU coupling reagent`;

const DEMO_SUPPLY = `PROCUREMENT_PLAN_ID: SUP-2026-001
PRECURSOR 1:
- CHEMICAL: 4-Chloro-2-fluoroaniline
- CAS: 2106-09-4 / QUANTITY: 0.5kg
- SUPPLIER: Sigma-Aldrich / LEAD_TIME: 4h / STATUS: AVAILABLE
PRECURSOR 2:
- CHEMICAL: 3,5-Bis(trifluoromethyl)benzaldehyde
- CAS: 401-95-6 / QUANTITY: 0.3kg
- SUPPLIER: Combi-Blocks / LEAD_TIME: 6h / STATUS: AVAILABLE
PRECURSOR 3:
- CHEMICAL: Glycine ethyl ester hydrochloride
- CAS: 623-33-6 / QUANTITY: 0.2kg
- SUPPLIER: TCI America / LEAD_TIME: 2h / STATUS: AVAILABLE
PRECURSOR 4:
- CHEMICAL: HATU coupling reagent
- CAS: 148893-10-1 / QUANTITY: 0.1kg
- SUPPLIER: Oakwood Chemical / LEAD_TIME: 8h / STATUS: EXPEDITE
TOTAL_ACQUISITION_TIME: 8 hours
SYNTHESIS_START_ETA: 9 hours
MISSION_COMPLETION_ETA: 47 hours
CONFIDENCE_PCT: 94%`;

const SYSTEM_INTEL = `You are HELIX-SCOUT, an autonomous bio-threat analysis agent. Analyze the threat and return a structured report with these exact fields: THREAT_ID, THREAT_CLASS, TARGET_PROTEIN, CANDIDATE_SCAFFOLD (SMILES), KNOWN_RESISTANCE, URGENCY_TIER (CRITICAL/HIGH/MEDIUM), VULNERABILITY_WINDOW (hours), POPULATION_AT_RISK, RECOMMENDED_ACTION.`;
const SYSTEM_SYNTH = `You are HELIX-FORGE, an autonomous drug discovery agent. Design exactly 3 lead compounds. For each: COMPOUND_ID, SMILES, R_GROUP_MODIFICATION, PRED_BINDING (kcal/mol), ADMET_FLAGS, SYNTHESIS_STEPS, PRIORITY. End with LEAD_RECOMMENDATION and REQUIRED_PRECURSORS.`;
const SYSTEM_SUPPLY = `You are HELIX-CHAIN, an autonomous supply chain agent. Create a procurement plan. For each precursor: CHEMICAL_NAME, CAS_NUMBER, QUANTITY_KG, SUPPLIER (Sigma-Aldrich / TCI America / Combi-Blocks / Oakwood Chemical), LEAD_TIME_HOURS, AVAILABILITY_STATUS. End with TOTAL_ACQUISITION_TIME, SYNTHESIS_START_ETA, MISSION_COMPLETION_ETA, CONFIDENCE_PCT.`;

async function callGemini(systemPrompt: string, userPrompt: string, apiKey: string) {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 900 }
    })
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.candidates[0].content.parts[0].text;
}

const easeOutCubic = (x: number): number => {
  return 1 - Math.pow(1 - x, 3);
};

const CanvasSimulation = ({ active, isRunning, isDeployed, agents, metrics }: { active: boolean, isRunning: boolean, isDeployed: boolean, agents: any[], metrics: any[] }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stats, setStats] = useState({ pathogens: 0, compounds: 0, neutralized: 0 });

  // Compute Phase
  let computedPhase: 'idle' | 'infected' | 'containing' | 'contained' = 'idle';
  if (isRunning || active) computedPhase = 'infected';
  if (agents[1]?.status === 'COMPLETE' || active) computedPhase = 'containing';
  if (metrics[0]?.val === metrics[0]?.target && active) computedPhase = 'contained';

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 500;
    let height = 520;
    canvas.width = width;
    canvas.height = height;

    type NodeId = 'HEAD' | 'NECK' | 'LEFT_LUNG' | 'RIGHT_LUNG' | 'HEART' | 'LIVER' | 'STOMACH' | 'LEFT_ARM' | 'RIGHT_ARM' | 'TORSO' | 'LEFT_LEG' | 'RIGHT_LEG';
    type RegionType = 'circle' | 'rect' | 'ellipse' | 'roundedRect';
    interface RegionDef {
      id: NodeId; name: string; type: RegionType;
      x?: number; y?: number; w?: number; h?: number;
      cx?: number; cy?: number; r?: number; rx?: number; ry?: number;
      infected: boolean; contained: boolean; hasBeenInfected: boolean; pathogens: number; compounds: number;
    }

    const regionDefs: RegionDef[] = [
      { id: 'HEAD', name: 'HEAD', type: 'circle', cx: 250, cy: 60, r: 38, infected: false, contained: false, hasBeenInfected: false, pathogens: 0, compounds: 0 },
      { id: 'NECK', name: 'NECK', type: 'rect', x: 236, y: 96, w: 28, h: 30, infected: false, contained: false, hasBeenInfected: false, pathogens: 0, compounds: 0 },
      { id: 'LEFT_LUNG', name: 'LEFT LUNG', type: 'ellipse', cx: 210, cy: 185, rx: 38, ry: 55, infected: false, contained: false, hasBeenInfected: false, pathogens: 0, compounds: 0 },
      { id: 'RIGHT_LUNG', name: 'RIGHT LUNG', type: 'ellipse', cx: 290, cy: 185, rx: 38, ry: 55, infected: false, contained: false, hasBeenInfected: false, pathogens: 0, compounds: 0 },
      { id: 'HEART', name: 'HEART', type: 'circle', cx: 250, cy: 195, r: 18, infected: false, contained: false, hasBeenInfected: false, pathogens: 0, compounds: 0 },
      { id: 'LIVER', name: 'LIVER', type: 'ellipse', cx: 270, cy: 265, rx: 35, ry: 25, infected: false, contained: false, hasBeenInfected: false, pathogens: 0, compounds: 0 },
      { id: 'STOMACH', name: 'STOMACH', type: 'ellipse', cx: 230, cy: 270, rx: 25, ry: 22, infected: false, contained: false, hasBeenInfected: false, pathogens: 0, compounds: 0 },
      { id: 'LEFT_ARM', name: 'LEFT ARM', type: 'rect', x: 155, y: 135, w: 22, h: 110, infected: false, contained: false, hasBeenInfected: false, pathogens: 0, compounds: 0 },
      { id: 'RIGHT_ARM', name: 'RIGHT ARM', type: 'rect', x: 323, y: 135, w: 22, h: 110, infected: false, contained: false, hasBeenInfected: false, pathogens: 0, compounds: 0 },
      { id: 'TORSO', name: 'TORSO', type: 'roundedRect', x: 185, y: 130, w: 130, h: 160, infected: false, contained: false, hasBeenInfected: false, pathogens: 0, compounds: 0 },
      { id: 'LEFT_LEG', name: 'LEFT LEG', type: 'rect', x: 205, y: 295, w: 38, h: 140, infected: false, contained: false, hasBeenInfected: false, pathogens: 0, compounds: 0 },
      { id: 'RIGHT_LEG', name: 'RIGHT LEG', type: 'rect', x: 257, y: 295, w: 38, h: 140, infected: false, contained: false, hasBeenInfected: false, pathogens: 0, compounds: 0 }
    ];

    const pathsRecord = {
      heart_llung: { p0: {x:250,y:195}, p1: {x:230,y:200}, p2: {x:210,y:185} },
      heart_rlung: { p0: {x:250,y:195}, p1: {x:270,y:200}, p2: {x:290,y:185} },
      heart_head:  { p0: {x:250,y:195}, p1: {x:220,y:140}, p2: {x:250,y:60} },
      heart_liver: { p0: {x:250,y:195}, p1: {x:250,y:230}, p2: {x:270,y:265} },
      heart_larm:  { p0: {x:250,y:195}, p1: {x:200,y:160}, p2: {x:166,y:150} },
      heart_rarm:  { p0: {x:250,y:195}, p1: {x:300,y:160}, p2: {x:334,y:150} },
      heart_lleg:  { p0: {x:250,y:195}, p1: {x:230,y:250}, p2: {x:224,y:295} },
      heart_rleg:  { p0: {x:250,y:195}, p1: {x:270,y:250}, p2: {x:276,y:295} },
      liver_stomach: { p0: {x:270,y:265}, p1: {x:250,y:280}, p2: {x:230,y:270} }
    };

    const adj: Record<string, {to: NodeId, pathKey: keyof typeof pathsRecord, reverse: boolean}[]> = {
      LEFT_LUNG: [{ to: 'HEART', pathKey: 'heart_llung', reverse: true }],
      RIGHT_LUNG: [{ to: 'HEART', pathKey: 'heart_rlung', reverse: true }],
      HEART: [
        { to: 'LEFT_LUNG', pathKey: 'heart_llung', reverse: false }, { to: 'RIGHT_LUNG', pathKey: 'heart_rlung', reverse: false },
        { to: 'HEAD', pathKey: 'heart_head', reverse: false }, { to: 'LIVER', pathKey: 'heart_liver', reverse: false },
        { to: 'LEFT_ARM', pathKey: 'heart_larm', reverse: false }, { to: 'RIGHT_ARM', pathKey: 'heart_rarm', reverse: false },
        { to: 'LEFT_LEG', pathKey: 'heart_lleg', reverse: false }, { to: 'RIGHT_LEG', pathKey: 'heart_rleg', reverse: false }
      ],
      HEAD: [{ to: 'HEART', pathKey: 'heart_head', reverse: true }],
      LIVER: [{ to: 'HEART', pathKey: 'heart_liver', reverse: true }, { to: 'STOMACH', pathKey: 'liver_stomach', reverse: false }],
      STOMACH: [{ to: 'LIVER', pathKey: 'liver_stomach', reverse: true }],
      LEFT_ARM: [{ to: 'HEART', pathKey: 'heart_larm', reverse: true }],
      RIGHT_ARM: [{ to: 'HEART', pathKey: 'heart_rarm', reverse: true }],
      LEFT_LEG: [{ to: 'HEART', pathKey: 'heart_lleg', reverse: true }],
      RIGHT_LEG: [{ to: 'HEART', pathKey: 'heart_rleg', reverse: true }],
      TORSO: [], NECK: []
    };

    function getQuadBezierPoint(p0: any, p1: any, p2: any, t: number) {
      const mt = 1 - t;
      return { x: mt*mt*p0.x + 2*mt*t*p1.x + t*t*p2.x, y: mt*mt*p0.y + 2*mt*t*p1.y + t*t*p2.y };
    }

    function getNextNode(current: NodeId, target: NodeId): NodeId {
       if (current === target) return current;
       if (current === 'LEFT_LUNG' || current === 'RIGHT_LUNG' || current === 'LEFT_ARM' || current === 'RIGHT_ARM' || current === 'HEAD' || current === 'LEFT_LEG' || current === 'RIGHT_LEG') return 'HEART';
       if (current === 'STOMACH') return 'LIVER';
       if (current === 'LIVER') return target === 'STOMACH' ? 'STOMACH' : 'HEART';
       if (current === 'HEART') return target === 'STOMACH' ? 'LIVER' : target;
       return target;
    }

    class Particle {
      type: 'pathogen' | 'compound'; x: number; y: number;
      targetRegion: NodeId; currentNode: NodeId; nextNode: NodeId | null = null;
      pathKey: keyof typeof pathsRecord | null = null; reverse: boolean = false;
      t: number = 0; residing: boolean = true; vx: number; vy: number;

      constructor(type: 'pathogen' | 'compound', target: NodeId, start: NodeId) {
        this.type = type; this.targetRegion = target; this.currentNode = start;
        let r = regionDefs.find(reg => reg.id === start)!;
        this.x = r.cx ?? (r.x! + r.w!/2); this.y = r.cy ?? (r.y! + r.h!/2);
        this.vx = (Math.random() - 0.5) * 1.5; this.vy = (Math.random() - 0.5) * 1.5;
      }

      update() {
        if (this.residing) {
           if (this.currentNode === this.targetRegion && this.type === 'compound') {
              let mostInfected = regionDefs.filter(r => r.pathogens > 0).sort((a,b) => b.pathogens - a.pathogens)[0];
              if (mostInfected && mostInfected.id !== this.currentNode) {
                 this.targetRegion = mostInfected.id;
              }
           }
           if (this.currentNode !== this.targetRegion && adj[this.currentNode]) {
              this.nextNode = getNextNode(this.currentNode, this.targetRegion);
              let link = adj[this.currentNode].find(l => l.to === this.nextNode);
              if (link) {
                 this.pathKey = link.pathKey; this.reverse = link.reverse;
                 this.t = this.reverse ? 1 : 0; this.residing = false;
              } else { this.targetRegion = this.currentNode; }
           } else {
              this.x += this.vx; this.y += this.vy;
              let r = regionDefs.find(reg => reg.id === this.currentNode)!;
              let cx = r.cx ?? (r.x! + r.w!/2); let cy = r.cy ?? (r.y! + r.h!/2);
              let dx = this.x - cx; let dy = this.y - cy;
              if (dx*dx + dy*dy > 400) { this.vx -= dx * 0.01; this.vy -= dy * 0.01; }
           }
        } else {
           let speed = this.type === 'pathogen' ? 0.005 : 0.008;
           if (this.reverse) {
             this.t -= speed; if (this.t <= 0) { this.currentNode = this.nextNode!; this.residing = true; }
           } else {
             this.t += speed; if (this.t >= 1) { this.currentNode = this.nextNode!; this.residing = true; }
           }
           if (!this.residing) {
              let p = pathsRecord[this.pathKey!];
              let pos = getQuadBezierPoint(p.p0, p.p1, p.p2, this.t);
              this.x = pos.x; this.y = pos.y;
           }
        }
      }

      draw(ctx: CanvasRenderingContext2D) {
         ctx.beginPath(); ctx.arc(this.x, this.y, 3, 0, Math.PI*2);
         if (this.type === 'pathogen') {
            ctx.fillStyle = '#ff2244'; ctx.shadowBlur = 8; ctx.shadowColor = '#ff2244';
         } else {
            ctx.fillStyle = '#00ff88'; ctx.shadowBlur = 8; ctx.shadowColor = '#00ff88';
         }
         ctx.fill(); ctx.shadowBlur = 0;
      }
    }

    class Flash {
      x: number; y: number; radius: number; opacity: number; color: string;
      constructor(x: number, y: number, color: string = '255,255,255') {
        this.x = x; this.y = y; this.radius = 0; this.opacity = 1; this.color = color;
      }
      update() { this.radius += 20/15; this.opacity -= 1/15; }
      draw(ctx: CanvasRenderingContext2D) {
        if (this.opacity <= 0) return;
        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2);
        ctx.fillStyle = `rgba(${this.color}, ${Math.max(0, this.opacity)})`;
        ctx.fill();
      }
    }

    class Ripple {
      r: number = 0; opacity: number = 1;
      update() { this.r += 3; this.opacity -= 0.015; }
      draw(ctx: CanvasRenderingContext2D) {
         if (this.opacity <= 0) return;
         ctx.beginPath(); ctx.arc(250, 195, this.r, 0, Math.PI*2);
         ctx.strokeStyle = `rgba(0, 255, 136, ${Math.max(0, this.opacity)})`;
         ctx.lineWidth = 2; ctx.stroke();
      }
    }

    let pathogens: Particle[] = [];
    let compounds: Particle[] = [];
    let flashes: Flash[] = [];
    let ripples: Ripple[] = [];
    let globalT = 0;
    
    let lastPathogenSpawn = 0;
    let lastCompoundSpawn = 0;
    let localPhase = computedPhase;
    let phaseStartTime = performance.now();
    let neutralizedCount = 0;
    let lastStatUpdate = 0;
    let rippleCount = 0;

    let loopId: number;

    const render = (time: number) => {
      ctx.fillStyle = '#020a05';
      ctx.fillRect(0, 0, width, height);

      if (localPhase !== computedPhase) {
         if (computedPhase === 'contained' && localPhase !== 'contained') {
            ripples.push(new Ripple());
            setTimeout(() => ripples.push(new Ripple()), 500);
            setTimeout(() => ripples.push(new Ripple()), 1000);
         }
         localPhase = computedPhase;
         phaseStartTime = time;
      }
      let elapsed = time - phaseStartTime;

      if (localPhase === 'infected' || localPhase === 'containing') {
         if (time - lastPathogenSpawn > 800 && pathogens.length < 60) {
            lastPathogenSpawn = time;
            let start: NodeId = Math.random() > 0.5 ? 'LEFT_LUNG' : 'RIGHT_LUNG';
            let targets: NodeId[] = ['LEFT_LUNG', 'RIGHT_LUNG'];
            let eMs = localPhase === 'infected' ? elapsed : (elapsed + 30000); // assume full spread if containing
            if (eMs > 5000) targets.push('HEART');
            if (eMs > 11000) targets.push('LIVER');
            if (eMs > 14000) targets.push('STOMACH');
            if (eMs > 17000) targets.push('HEAD');
            if (eMs > 20000) targets.push('LEFT_ARM', 'RIGHT_ARM');
            if (eMs > 25000) targets.push('LEFT_LEG', 'RIGHT_LEG');
            pathogens.push(new Particle('pathogen', targets[Math.floor(Math.random() * targets.length)], start));
         }
      }

      if ((localPhase === 'containing' || localPhase === 'contained') && time - lastCompoundSpawn > 600) {
         lastCompoundSpawn = time;
         let mostInfected = regionDefs.filter(r => r.pathogens > 0).sort((a,b) => b.pathogens - a.pathogens)[0];
         let target: NodeId = mostInfected ? mostInfected.id : 'HEART';
         compounds.push(new Particle('compound', target, 'RIGHT_ARM'));
         compounds.push(new Particle('compound', target, 'RIGHT_ARM'));
      }

      regionDefs.forEach(r => { r.pathogens = 0; r.compounds = 0; });
      pathogens.forEach(p => { if (p.residing) { let r = regionDefs.find(reg => reg.id === p.currentNode); if (r) r.pathogens++; } });
      compounds.forEach(c => { if (c.residing) { let r = regionDefs.find(reg => reg.id === c.currentNode); if (r) r.compounds++; } });

      regionDefs.forEach(r => {
         if (r.pathogens > 0) {
            r.infected = true; r.contained = false; r.hasBeenInfected = true;
         } else if (r.hasBeenInfected && r.pathogens === 0 && (localPhase === 'containing' || localPhase === 'contained')) {
            r.contained = true; r.infected = false;
         }
      });

      globalT += 0.004;
      Object.values(pathsRecord).forEach(p => {
         ctx.beginPath(); ctx.moveTo(p.p0.x, p.p0.y);
         ctx.quadraticCurveTo(p.p1.x, p.p1.y, p.p2.x, p.p2.y);
         ctx.strokeStyle = 'rgba(0, 212, 255, 0.1)'; ctx.lineWidth = 1.5; ctx.stroke();
         for(let i=0; i<4; i++) {
           let t = (globalT + (i / 4)) % 1;
           let pos = getQuadBezierPoint(p.p0, p.p1, p.p2, t);
           ctx.beginPath(); ctx.arc(pos.x, pos.y, 1.5, 0, Math.PI*2);
           if (localPhase === 'idle') ctx.fillStyle = '#00d4ff';
           else if (localPhase === 'infected') ctx.fillStyle = '#ff2244';
           else if (localPhase === 'containing') ctx.fillStyle = ((i + Math.floor(globalT*10)) % 2 === 0) ? '#00ff88' : '#ff2244';
           else ctx.fillStyle = '#00ff88';
           ctx.fill();
         }
      });

      regionDefs.forEach(reg => {
         ctx.beginPath();
         if (reg.type === 'circle') ctx.arc(reg.cx!, reg.cy!, reg.r!, 0, Math.PI*2);
         else if (reg.type === 'rect') ctx.rect(reg.x!, reg.y!, reg.w!, reg.h!);
         else if (reg.type === 'ellipse') ctx.ellipse(reg.cx!, reg.cy!, reg.rx!, reg.ry!, 0, 0, Math.PI*2);
         else if (reg.type === 'roundedRect') {
           if (ctx.roundRect) ctx.roundRect(reg.x!, reg.y!, reg.w!, reg.h!, 10);
           else ctx.rect(reg.x!, reg.y!, reg.w!, reg.h!);
         }
         ctx.shadowBlur = 0; ctx.lineWidth = 1.5;
         if (localPhase === 'idle' || (!reg.infected && !reg.contained && localPhase !== 'contained')) {
            ctx.strokeStyle = 'rgba(0,255,136,0.3)'; ctx.stroke();
         } else if (reg.contained || localPhase === 'contained') {
            ctx.fillStyle = 'rgba(0,255,136,0.2)'; ctx.strokeStyle = '#00ff88';
            ctx.shadowBlur = 15; ctx.shadowColor = '#00ff88'; ctx.fill(); ctx.stroke();
         } else if (reg.infected) {
            if (localPhase === 'containing') {
               ctx.fillStyle = 'rgba(0,255,136,0.1)'; ctx.strokeStyle = '#00ff88';
               ctx.shadowBlur = 15; ctx.shadowColor = '#00ff88'; ctx.fill(); ctx.stroke();
            } else {
               ctx.fillStyle = 'rgba(255,34,68,0.15)'; ctx.strokeStyle = '#ff2244';
               ctx.shadowBlur = 15; ctx.shadowColor = '#ff2244'; ctx.fill(); ctx.stroke();
            }
         }
         
         ctx.shadowBlur = 0;
         let lx = reg.cx ?? (reg.x! + reg.w! + 5); let ly = reg.cy ?? (reg.y! + 5);
         ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.font = '8px monospace';
         ctx.textAlign = 'center'; ctx.fillText(reg.name, reg.cx ?? (reg.x! + reg.w!/2), (reg.cy ?? (reg.y! + reg.h!)) + 12);
      });

      for (let i = pathogens.length - 1; i >= 0; i--) {
         for (let j = compounds.length - 1; j >= 0; j--) {
            let p = pathogens[i]; let c = compounds[j];
            let dx = p.x - c.x; let dy = p.y - c.y;
            if (dx*dx + dy*dy < 100) {
               flashes.push(new Flash(p.x, p.y));
               pathogens.splice(i, 1); compounds.splice(j, 1);
               neutralizedCount++; break;
            }
         }
      }

      pathogens.forEach(p => { p.update(); p.draw(ctx); });
      compounds.forEach(c => { c.update(); c.draw(ctx); });
      compounds = compounds.filter(c => c.x < width + 20 && c.x > -20 && c.y > -20 && c.y < height + 20);

      flashes.forEach(f => { f.update(); f.draw(ctx); });
      flashes = flashes.filter(f => f.opacity > 0);
      ripples.forEach(r => { r.update(); r.draw(ctx); });
      ripples = ripples.filter(r => r.opacity > 0);

      if (localPhase === 'containing' || localPhase === 'contained') {
         let p = (Math.sin(time * 0.005) + 1) / 2;
         ctx.save(); 
         // Top-ish of the right arm
         ctx.translate(334, 145); 
         // Tilt pointing inward to the arm
         ctx.rotate(-Math.PI/4); 

         ctx.globalAlpha = 0.6 + p*0.4;
         ctx.shadowBlur = 8; ctx.shadowColor = '#00ff88';

         // Syringe body (glass)
         ctx.fillStyle = 'rgba(255,255,255,0.7)';
         ctx.fillRect(-3, -15, 6, 12);
         // Liquid inside
         ctx.fillStyle = '#00ff88';
         ctx.fillRect(-2, -14, 4, 10);
         // Flanges
         ctx.fillStyle = 'rgba(255,255,255,1)';
         ctx.fillRect(-6, -15, 12, 2);
         // Plunger
         ctx.fillStyle = '#aaaaaa';
         ctx.fillRect(-1, -22, 2, 7);
         ctx.fillRect(-4, -22, 8, 2);
         // Needle base
         ctx.fillStyle = '#cccccc';
         ctx.fillRect(-2, -3, 4, 3);
         // Needle
         ctx.fillStyle = '#ffffff';
         ctx.fillRect(-0.5, 0, 1, 6);

         ctx.restore();
      }

      if (time - lastStatUpdate > 100) {
         setStats({ pathogens: pathogens.length, compounds: compounds.length, neutralized: neutralizedCount });
         lastStatUpdate = time;
      }

      loopId = requestAnimationFrame(render);
    };

    loopId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(loopId);
  }, [computedPhase]);

  let statusText = "SECURE";
  let statusColor = "text-[var(--cyan)]";
  if (computedPhase === 'infected') { statusText = "PATIENT ZERO — INFECTION SPREADING"; statusColor = "text-[var(--red)] animate-pulse"; }
  if (computedPhase === 'containing') { statusText = "COUNTERMEASURE DEPLOYED"; statusColor = "text-[var(--amber)]"; }
  if (computedPhase === 'contained') { statusText = "THREAT NEUTRALIZED — PATIENT STABILIZED"; statusColor = "text-[var(--green)]"; }

  const infLevel = Math.min(100, Math.floor((stats.pathogens / 60) * 100));
  const contLevel = Math.min(100, Math.floor((stats.neutralized / 60) * 100));

  return (
    <div className="w-full h-full relative" style={{ backgroundColor: '#020a05' }}>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full z-0 block" />
      
      {/* Overlays */}
      <div className="absolute top-4 left-4 z-10 w-40">
         <div className="text-[9px] font-bold tracking-widest text-[#ff2244] mb-1">INFECTION LEVEL</div>
         <div className="h-1 bg-black/50 overflow-hidden border border-[#ff2244]/20"><div className="h-full bg-[#ff2244] transition-all" style={{ width: `${infLevel}%` }}/></div>
         <div className="text-[10px] font-mono text-[#ff2244] text-right mt-0.5">{infLevel}%</div>
      </div>

      <div className="absolute top-4 right-4 z-10 w-40">
         <div className="text-[9px] font-bold tracking-widest text-[#00ff88] mb-1 text-right">CONTAINMENT</div>
         <div className="h-1 bg-black/50 overflow-hidden border border-[#00ff88]/20 flex justify-end"><div className="h-full bg-[#00ff88] transition-all" style={{ width: `${contLevel}%` }}/></div>
         <div className="text-[10px] font-mono text-[#00ff88] mt-0.5">{contLevel}%</div>
      </div>

      <div className="absolute bottom-4 left-0 w-full text-center z-10">
         <div className={`text-xs font-bold tracking-[0.2em] uppercase ${statusColor} drop-shadow-md`}>
           {statusText}
         </div>
         <div className="mt-1 font-mono text-[9px] text-[var(--cyan)] font-bold bg-black/60 px-3 py-1 inline-block rounded-full border border-white/10 mx-auto">
           PATHOGENS: {stats.pathogens.toString().padStart(2, '0')} | COMPOUNDS: {stats.compounds.toString().padStart(2, '0')} | NEUTRALIZED: {stats.neutralized.toString().padStart(2, '0')}
         </div>
      </div>
    </div>
  );
};


const AgentCard = ({ agent }: { agent: any; key?: string }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [agent.output]);

  const handleCopy = () => {
    navigator.clipboard.writeText(agent.output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div 
      className="panel border-l-2 flex flex-col overflow-hidden"
      style={{ borderLeftColor: 'var(--green)', boxShadow: 'inset 5px 0 15px -10px var(--green)' }}
    >
      <div className="p-3 flex justify-between items-center shrink-0 border-b border-white/5">
        <h3 
          className="font-bold tracking-wider uppercase" 
          style={{ fontFamily: 'var(--f-display)', color: 'var(--cyan)' }}
        >
          {agent.name}
        </h3>
        <span className={`text-[9px] border px-2 py-0.5 rounded-full ${
          agent.status === 'RUNNING' ? 'text-[var(--green)] border-[var(--green)] animate-pulse' : 
          agent.status === 'COMPLETE' ? 'text-[var(--cyan)] border-[var(--cyan)]' : 
          agent.status === 'ERROR' ? 'text-[var(--red)] border-[var(--red)]' : 
          'border-white/20 opacity-50'
        }`}>
          {agent.status}
        </span>
      </div>
      <div ref={contentRef} className="flex-1 p-3 flex flex-col items-start font-mono overflow-y-auto min-h-0">
        {agent.status === 'IDLE' ? (
          <span className="text-xs opacity-30 animate-pulse m-auto">
            AWAITING ACTIVATION...
          </span>
        ) : (
          <span className={`text-[10px] sm:text-xs opacity-80 whitespace-pre-wrap leading-relaxed ${agent.status === 'ERROR' ? 'text-[var(--red)]' : 'text-[var(--text)]'}`}>
            {agent.output}
          </span>
        )}
      </div>
      <div className="p-2 text-[10px] opacity-60 border-t border-white/5 flex justify-between items-center font-mono">
        <button onClick={handleCopy} disabled={!agent.output} className="hover:text-white transition-colors disabled:opacity-30">
          {copied ? '[COPIED ✓]' : '[COPY]'}
        </button>
        <span>T+ {agent.elapsed.toFixed(1)}s</span>
      </div>
    </div>
  );
};


const PRESETS: Record<string, string> = {
  'HIV-RT VARIANT': "THREAT: Synthetic pathogen SYN-2026-Δ7. Modified HIV-1 RT with K103N+E138K+V179D triple resistance. Aerosol-enhanced. 3 confirmed, 47 projected in 72h.",
  'ANTHRAX ANALOG': "THREAT: Engineered Bacillus anthracis variant BA-X9. Modified protective antigen with altered LF binding domain. Antibiotic-resistant (ciprofloxacin MIC >32). Spore dispersal confirmed, 5 exposure sites.",
  'NOVEL PRION': "THREAT: Synthetic prion variant PrP-Δ22. Accelerated misfolding cascade, 6-day incubation vs 6-month baseline. CNS targeting confirmed. No known therapeutic scaffold exists."
};

export default function App() {
  const [apiKey, setApiKey] = useState('');
  const [scenario, setScenario] = useState('');
  const [keyError, setKeyError] = useState(false);
  
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  
  const [logs, setLogs] = useState([{ time: '00:00:00', text: 'HELIX SYNTHGEN INITIALIZED. STANDING BY FOR PROTOCOL INITIATION...' }]);
  
  const addLog = (text: string) => {
    const now = new Date();
    const timeStr = now.toISOString().substring(11, 19);
    setLogs(prev => [...prev, { time: timeStr, text }]);
  };

  const logsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (logsRef.current) {
      logsRef.current.scrollTop = logsRef.current.scrollHeight;
    }
  }, [logs]);

  useEffect(() => {
    let interval: any;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds(s => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const formatTimer = (s: number) => {
    const mins = Math.floor(s / 60).toString().padStart(2, '0');
    const secs = (s % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const [agents, setAgents] = useState([
    { name: 'HELIX-SCOUT', status: 'IDLE', output: '', elapsed: 0 },
    { name: 'HELIX-FORGE', status: 'IDLE', output: '', elapsed: 0 },
    { name: 'HELIX-CHAIN', status: 'IDLE', output: '', elapsed: 0 }
  ]);

  const updateAgent = (index: number, updates: any) => {
    setAgents(prev => {
      const newAgents = [...prev];
      newAgents[index] = { ...newAgents[index], ...updates };
      return newAgents;
    });
  };

  const [metrics, setMetrics] = useState([
    { label: "THREAT CONTAINMENT", val: 0, start: 0, target: 87, color: "bg-green-500" },
    { label: "COMPOUND EFFICACY", val: 0, start: 0, target: 91, color: "bg-green-500" },
    { label: "SUPPLY READINESS", val: 0, start: 0, target: 94, color: "bg-cyan-500" },
    { label: "POPULATION AT RISK", val: 100, start: 100, target: 13, color: "bg-red-500" }
  ]);

  const [allComplete, setAllComplete] = useState(false);
  const [isDeployed, setIsDeployed] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (allComplete && !isDeployed) {
      let startTimestamp: number | null = null;
      const duration = 8000;

      const step = (timestamp: number) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const ease = easeOutCubic(progress);

        setMetrics(prev => prev.map(m => {
          const currentVal = m.start + (m.target - m.start) * ease;
          return { ...m, val: Math.round(currentVal) };
        }));

        if (progress < 1) {
          requestAnimationFrame(step);
        }
      };
      const r_id = requestAnimationFrame(step);
      return () => cancelAnimationFrame(r_id);
    }
  }, [allComplete, isDeployed]);

  const typewrite = (index: number, text: string) => {
    return new Promise<void>(resolve => {
      let i = 0;
      let currentOutput = '';
      const tId = setInterval(() => {
        currentOutput += text.charAt(i);
        updateAgent(index, { output: currentOutput });
        i++;
        if (i >= text.length) {
          clearInterval(tId);
          resolve();
        }
      }, 12);
    });
  };

  const handleReset = () => {
    setIsRunning(false);
    setAllComplete(false);
    setIsDeployed(false);
    setTimerSeconds(0);
    setIsTimerRunning(false);
    setAgents(prev => prev.map(a => ({ ...a, status: 'IDLE', output: '', elapsed: 0 })));
    setMetrics(prev => prev.map(m => ({ ...m, val: m.start })));
    setLogs([{ time: new Date().toISOString().substring(11, 19), text: 'HELIX SYNTHGEN INITIALIZED. STANDING BY FOR PROTOCOL INITIATION...' }]);
    setKeyError(false);
  };

  const startOrchestration = async (isDemo: boolean) => {
    if (isRunning) return;
    
    if (!isDemo && !apiKey.trim()) {
      setKeyError(true);
      addLog('ERROR: API key required for live execution.');
      setTimeout(() => setKeyError(false), 500);
      return;
    }

    setIsRunning(true);
    setAllComplete(false);
    setIsDeployed(false);
    setTimerSeconds(0);
    setIsTimerRunning(true);
    
    setAgents(prev => prev.map(a => ({ ...a, status: 'IDLE', output: '', elapsed: 0 })));
    setMetrics(prev => prev.map(m => ({ ...m, val: m.start })));
    
    addLog(`PROTOCOL INITIATED (${isDemo ? 'DEMO' : 'LIVE'} MODE).`);

    const runAgent = async (index: number, promptInput: string, systemPrompt: string, demoResult: string) => {
      updateAgent(index, { status: 'RUNNING', output: '', elapsed: 0 });
      let agentInterval = setInterval(() => {
        setAgents(prev => {
          const n = [...prev];
          n[index].elapsed += 0.1;
          return n;
        });
      }, 100);

      let resultText = '';
      try {
        if (!isDemo && apiKey) {
          resultText = await callGemini(systemPrompt, promptInput, apiKey);
        } else {
          await new Promise(r => setTimeout(r, 600));
          resultText = demoResult;
        }

        clearInterval(agentInterval);

        // Typewriter effect updates state
        await typewrite(index, resultText);
        
        updateAgent(index, { status: 'COMPLETE' });
        addLog(`${['HELIX-SCOUT', 'HELIX-FORGE', 'HELIX-CHAIN'][index]} AGENT CYCLE COMPLETE.`);
        return resultText;
      } catch (err: any) {
        clearInterval(agentInterval);
        updateAgent(index, { status: 'ERROR', output: err.message });
        addLog(`${['HELIX-SCOUT', 'HELIX-FORGE', 'HELIX-CHAIN'][index]} AGENT ERROR: ${err.message}`);
        throw err;
      }
    };

    try {
      const activeScenario = scenario.trim() || 'ANALYSIS OF NOVEL SYNTHETIC VIRAL VECTOR DETECTED IN SECTOR 7...';
      const r1 = await runAgent(0, activeScenario, SYSTEM_INTEL, DEMO_INTEL);
      const r2 = await runAgent(1, r1, SYSTEM_SYNTH, DEMO_SYNTH);
      await runAgent(2, r2, SYSTEM_SUPPLY, DEMO_SUPPLY);
      
      setAllComplete(true);
      setIsRunning(false);
      addLog('ALL AGENTS COMPLETED SUCCESSFULLY. AWAITING COMMANDER OVERRIDE.');
    } catch (err) {
      addLog('PROTOCOL HALTED DUE TO ERROR.');
      setIsTimerRunning(false);
      setIsRunning(false);
    }
  };

  return (
    <div className="h-full flex flex-col selection:bg-[var(--cyan)] selection:text-black">
      {/* 1. STICKY HEADER */}
      <header className="panel h-16 flex items-center justify-between px-6 z-10 shrink-0">
        <div className="flex flex-col">
          <div className="flex items-center gap-4">
            <h1 
              className="text-3xl font-black tracking-widest glow-green leading-none"
              style={{ fontFamily: 'var(--f-display)', color: 'var(--green)' }}
            >
              HELIX SYNTHGEN
            </h1>
            <div className="border border-[var(--green)] text-[var(--green)] px-2 py-0.5 rounded text-[9px] font-bold opacity-70 pulsing tracking-widest whitespace-nowrap">
              ⬡ MCP-SECURED
            </div>
          </div>
          <span className="text-[10px] tracking-[0.2em] font-bold uppercase" style={{ color: 'var(--cyan)' }}>
            AUTONOMOUS BIO-DEFENSE SYNTHESIS NETWORK
          </span>
        </div>

        <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center">
          <div className="text-2xl font-bold" style={{ fontFamily: 'var(--f-display)', color: 'var(--amber)' }}>
            {formatTimer(timerSeconds)}
          </div>
        </div>

        <div className="flex gap-6">
          {['INTEL', 'SYNTH', 'SUPPLY'].map((label, idx) => {
             const ag = agents[idx];
             const isRun = ag.status === 'RUNNING';
             return (
              <div key={label} className="flex items-center gap-2">
                <div 
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${isRun ? 'pulsing scale-150' : 'opacity-70'}`} 
                  style={{ backgroundColor: 'var(--green)', boxShadow: isRun ? '0 0 10px var(--green)' : '0 0 5px var(--green)' }} 
                />
                <span className="text-[10px] font-bold">
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </header>

      <main className="flex-1 flex flex-col p-4 gap-4 overflow-x-hidden overflow-y-auto">
        
        {/* 2. SETUP PANEL */}
        <section className="panel p-4 flex flex-col gap-3 shrink-0">
          <div className="flex gap-4">
            <div className="flex-1 flex flex-col justify-end">
              <label className="text-[10px] font-bold opacity-70 mb-1 block">
                GEMINI API KEY
              </label>
              <input 
                type="password" 
                value={apiKey}
                onChange={e => { setApiKey(e.target.value); setKeyError(false); }}
                placeholder="ENTER SECURE CREDENTIAL" 
                className={`w-full bg-black/40 border ${keyError ? 'border-[var(--red)] animate-shake text-[var(--red)]' : 'border-white/10 text-cyan-400'} px-3 py-1 text-sm outline-none placeholder:opacity-50 placeholder:text-gray-400`}
              />
            </div>
            <div className="flex-[2] w-2/3">
              <label className="text-[10px] font-bold opacity-70 mb-1 block">
                THREAT SCENARIO
              </label>
              <textarea 
                rows={2} 
                value={scenario}
                onChange={e => setScenario(e.target.value)}
                placeholder="DESCRIBE OUTBREAK PARAMETERS..." 
                className="w-full bg-black/40 border border-white/10 px-3 py-1 text-sm outline-none resize-none h-12 placeholder:opacity-50 placeholder:text-gray-400 text-[var(--cyan)]"
              />
            </div>
          </div>
          
          <div className="flex justify-between items-center mt-1">
            <div className="flex gap-2">
              {['HIV-RT VARIANT', 'ANTHRAX ANALOG', 'NOVEL PRION'].map((preset) => (
                <button 
                  key={preset}
                  onClick={() => setScenario(PRESETS[preset] || '')}
                  className="border border-cyan-500 px-4 py-1 text-[11px] font-bold text-[var(--cyan)] hover:bg-cyan-900/30 transition-colors"
                >
                  [{preset}]
                </button>
              ))}
            </div>
            <div className="flex gap-4">
              <button 
                onClick={handleReset}
                disabled={isRunning}
                className="px-6 py-1 font-bold text-sm bg-red-900/20 border border-red-500 hover:bg-red-900/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
                style={{ fontFamily: 'var(--f-display)', color: 'var(--red)' }}
              >
                RESET
              </button>
              <button 
                onClick={() => startOrchestration(true)}
                disabled={isRunning}
                className="px-6 py-1 font-bold text-sm bg-cyan-900/20 border border-cyan-500 hover:bg-cyan-900/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
                style={{ fontFamily: 'var(--f-display)', color: 'var(--cyan)' }}
              >
                DEMO MODE
              </button>
              <button 
                onClick={() => startOrchestration(false)}
                disabled={isRunning}
                className="px-6 py-1 font-bold text-sm bg-green-900/20 border border-green-500 hover:bg-green-900/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
                style={{ fontFamily: 'var(--f-display)', color: 'var(--green)' }}
              >
                INITIATE PROTOCOL
              </button>
            </div>
          </div>
        </section>

        {/* 3. THREE AGENT CARDS */}
        <section className="grid grid-cols-3 gap-4 h-[300px] shrink-0">
          {agents.map((agent, i) => (
            <AgentCard key={agent.name} agent={agent} />
          ))}
        </section>

        {/* 4. DIGITAL TWIN PANEL */}
        <section className="panel flex flex-col gap-4 p-4 shrink-0 h-[590px]">
          <div className="flex items-center gap-2 mb-2 p-2 border-b border-white/5">
             <div className="w-2 h-2 rounded-full bg-[var(--cyan)] animate-pulse" />
             <div className="font-bold tracking-[0.2em] text-[var(--cyan)]" style={{ fontFamily: 'var(--f-display)' }}>HELIX-TWIN</div>
             <div className="text-[10px] text-white/40 tracking-[0.1em] ml-2">PHYSIOLOGICAL SIMULATION ENGINE</div>
          </div>
          <div className="flex gap-4">
            <div className="w-[500px] h-[520px] rounded-lg border border-white/10 relative overflow-hidden shrink-0">
               <CanvasSimulation active={allComplete} isRunning={isRunning} isDeployed={isDeployed} agents={agents} metrics={metrics} />
            </div>
            
            <div className="flex-1 flex flex-col justify-center gap-4 py-8">
            {metrics.map((metric) => (
              <div key={metric.label} className="space-y-1">
                <div className="flex justify-between text-[10px] font-bold">
                  <span>{metric.label}</span>
                  <span style={{ fontFamily: 'var(--f-display)' }}>
                    {metric.val}%
                  </span>
                </div>
                <div className="h-1.5 bg-black/50 w-full rounded-full overflow-hidden border border-white/10">
                  <div className={`h-full ${metric.color} transition-all duration-[50ms]`} style={{ width: `${metric.val}%` }} />
                </div>
              </div>
            ))}
          </div>
          </div>
        </section>

        {/* 5. APPROVAL GATE */}
        {allComplete && !isDeployed && (
          <section className="panel border-2 border-[var(--orange)] p-8 text-center bg-[var(--orange)]/5 shrink-0 transition-opacity animate-in fade-in duration-700">
            <h2 className="font-bold text-[var(--orange)] text-xl tracking-widest mb-4" style={{ fontFamily: 'var(--f-display)' }}>
              PROTOCOL OVERRIDE REQUIRED
            </h2>
            <p className="text-[var(--text)] mb-6 font-mono text-sm opacity-80 leading-relaxed">
              Lead compound HELIX-FORGE-001 ready for synthesis.<br/>
              Supply chain secured. ETA: 47 hours.<br/>
              Autonomous agents operated without human intervention.<br/>
              Commander authorization required to proceed.
            </p>
            <button 
              onClick={() => {
                setIsDeployed(true);
                setIsTimerRunning(false);
                addLog('SYNTHESIS PROTOCOL AUTHORIZED.');
              }}
              className="border-2 border-[var(--orange)] bg-black px-8 py-3 text-[var(--orange)] tracking-widest hover:bg-[var(--orange)]/10 transition-colors"
              style={{ fontFamily: 'var(--f-display)' }}
            >
              AUTHORIZE ALLOCATIONS
            </button>
          </section>
        )}

        {isDeployed && (
          <section className="panel border-2 border-[var(--green)] p-6 text-center bg-[var(--green)]/10 shrink-0 transition-opacity animate-pulse">
             <h2 className="font-bold text-[var(--green)] text-xl tracking-widest" style={{ fontFamily: 'var(--f-display)' }}>
              ✓ SYNTHESIS PROTOCOL AUTHORIZED — MISSION CLOCK CONTINUES
             </h2>
          </section>
        )}

      </main>

      {/* 6. MISSION LOG */}
      <footer className="panel h-20 mx-4 mb-2 flex flex-col justify-start p-3 bg-black/80 font-mono text-xs overflow-y-auto shrink-0 transition-all">
        <div ref={logsRef} className="flex flex-col gap-1 w-full h-full overflow-y-auto pr-2">
          {logs.map((log, idx) => (
            <div key={idx} className="flex gap-4 opacity-80 hover:opacity-100 transition-opacity whitespace-pre-wrap">
              <span style={{ color: 'var(--green)' }} className="shrink-0">[{log.time}]</span>
              <span style={{ color: 'var(--cyan)' }} className="shrink-0">SYSTEM:</span>
              <span>{log.text}</span>
            </div>
          ))}
        </div>
      </footer>
      <div className="h-6 shrink-0 flex items-center justify-center text-[8px] text-[var(--text)] opacity-30 font-mono tracking-[4px]">
        PROJECT HELIX SYNTHGEN v1.0 — LABLAB.AI HACKATHON 2026 — BUILT ON GEMINI 2.0 FLASH
      </div>
    </div>
  );
}

#!/usr/bin/env tsx
import path from "path";
import fs from "fs";
import { FounderAgent } from "../src/web/founder/FounderAgent";

const DATA_DIR = path.resolve(__dirname, "..", "data");
const agent = new FounderAgent(DATA_DIR);

const args = process.argv.slice(2);
const command = args[0] || "daily";

async function main() {
  console.log("═══════════════════════════════════════════");
  console.log("  VISERON — FOUNDER OPERATING SYSTEM");
  console.log("  Pedro Costa · CEO & Founder");
  console.log("  Trinnity Viseron System");
  console.log("═══════════════════════════════════════════\n");

  switch (command) {
    case "daily": {
      const energy = parseInt(args[1]) || 7;
      const focus = parseInt(args[2]) || 7;
      const plan = agent.generateDailyPlan({ energy, focus, availableHours: 10 });
      console.log(`📅 ${plan.dayOfWeek}, ${plan.date} · Week ${plan.weekNumber}`);
      console.log(`⚡ Energy: ${energy}/10 · Focus: ${focus}/10\n`);
      console.log("━━━ TOP 3 MISSIONS ━━━\n");
      plan.top3.forEach((m) => {
        console.log(`  MISSION ${m.mission}: ${m.result}`);
        console.log(`    Why: ${m.why}`);
        console.log(`    Time: ${m.estimatedMinutes} min`);
        console.log(`    Done when: ${m.definitionOfDone}\n`);
      });
      console.log("━━━ SCHEDULE ━━━\n");
      plan.schedule.forEach((s) => console.log(`  ${s}`));
      console.log(`\n━━━ DEEP WORK ━━━`);
      console.log(`  Blocks: ${plan.deepWork.blocks} · Total: ${plan.deepWork.totalMinutes} min`);
      console.log(`\n━━━ HEALTH ━━━`);
      console.log(`  Exercise: ${plan.exercise.type} (${plan.exercise.minutes} min)`);
      console.log(`  Sleep target: 23:00`);
      console.log(`\n━━━ LEARNING ━━━`);
      console.log(`  Topic: ${plan.learning.topic}`);
      console.log(`  Language: ${plan.learning.language}`);
      console.log(`\n━━━ DELEGATE TO VISERON ━━━`);
      plan.delegateToViseron.forEach((d, i) => console.log(`  ${i + 1}. ${d}`));
      console.log(`\n⚠ RISK: ${plan.biggestRisk}`);
      console.log(`🌟 OPPORTUNITY: ${plan.biggestOpportunity}`);
      console.log(`\n✅ SUCCESS: ${plan.successCriteria}`);
      console.log(`\n📐 RULE: ${plan.founderRule}`);
      console.log(`\n💾 Plan saved to data/founder/plan-${plan.date}.json`);
      break;
    }
    case "status": {
      const status = agent.getStatus();
      console.log("━━━ FOUNDER STATUS ━━━\n");
      console.log(`Sleep: ${status.sleep}`);
      console.log(`Energy: ${status.energy}`);
      console.log(`Focus: ${status.focus}`);
      console.log(`Stress: ${status.stress}`);
      console.log(`Available: ${status.availableHours}\n`);
      console.log("── TOP 3 ──");
      status.top3.forEach((t, i) => console.log(`  ${i + 1}. ${t}`));
      console.log(`\nVISERON: ${status.viseronObjective}`);
      console.log(`BUSINESS: ${status.businessObjective}`);
      console.log(`\nLearning: ${status.learningTopic}`);
      console.log(`Language: ${status.languageSession}`);
      console.log(`Exercise: ${status.exerciseSession}`);
      console.log(`Personal: ${status.personalTime}`);
      console.log(`\n⚠ Risk: ${status.biggestRisk}`);
      console.log(`🌟 Opportunity: ${status.biggestOpportunity}`);
      break;
    }
    case "weekly": {
      const review = agent.generateWeeklyReview();
      console.log("━━━ WEEKLY REVIEW ━━━\n");
      console.log(`Period: ${review.weekStart} → ${review.weekEnd}\n`);
      console.log("Accomplished:");
      review.accomplished.forEach((a, i) => console.log(`  ${i + 1}. ${a}`));
      console.log("\nShould delegate/automate:");
      review.shouldAutomate.forEach((a) => console.log(`  - ${a}`));
      console.log(`\nBiggest bottleneck: ${review.biggestBottleneck}`);
      console.log(`Highest leverage action: ${review.highestLeverageAction}`);
      break;
    }
    case "kpis": {
      const kpis = agent.generateKPIs();
      console.log("━━━ FOUNDER KPIs ━━━\n");
      console.log("LIFE:");
      Object.entries(kpis.life).forEach(([k, v]) => console.log(`  ${k}: ${v}`));
      console.log("\nEXECUTION:");
      Object.entries(kpis.execution).forEach(([k, v]) => console.log(`  ${k}: ${v}`));
      console.log("\nCOMPANY:");
      Object.entries(kpis.company).forEach(([k, v]) => console.log(`  ${k}: ${v}`));
      console.log("\nVISERON:");
      Object.entries(kpis.viseron).forEach(([k, v]) => console.log(`  ${k}: ${v}`));
      break;
    }
    default:
      console.log("Usage: npm run founder -- [daily|status|weekly|kpis]");
      console.log("  daily [energy] [focus]  — Generate today's Founder Plan");
      console.log("  status                  — Show current Founder status");
      console.log("  weekly                  — Generate weekly review");
      console.log("  kpis                    — Show Founder KPIs");
  }

  console.log("\n───");
  console.log("Pedro es el fundador. Trinnity es la organización. VISERON es la multiplicación.");
  console.log("Think in decades. Execute in hours. Recover deliberately. Build relentlessly.");
}

main().catch(console.error);

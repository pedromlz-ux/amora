import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// No in-memory cache — reads from disk each request (Next.js module cache handles prod performance)

function loadTaco(): any[] {
  try {
    const filePath = path.join(process.cwd(), 'amora-api', 'src', 'main', 'resources', 'TACO.json');
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error("Error loading TACO.json:", error);
    return [];
  }
}

function loadTbca(): any[] {
  try {
    const filePath = path.join(process.cwd(), 'amora-api', 'src', 'main', 'resources', 'TBCA.json');
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const lines = fileContent.split('\n');
    const temp: any[] = [];
    let idCounter = 10000;
    for (let line of lines) {
      line = line.trim();
      if (!line) continue;
      try {
        const raw = JSON.parse(line);
        if (raw) {
          const food: any = { id: idCounter++, description: raw.descricao, category: raw.classe };
          if (raw.nutrientes) {
            for (const n of raw.nutrientes) {
              const rawVal = n["Valor por 100g"] || n.ValorPor100g;
              const val = rawVal ? String(rawVal).replace(",", ".") : "NA";
              const component = n.Componente?.toLowerCase();
              if (component === "energia" && n.Unidades?.toLowerCase() === "kcal") food.energy_kcal = val;
              else if (component === "proteína") food.protein_g = val;
              else if (component === "carboidrato total" || component === "carboidrato disponível") food.carbohydrate_g = val;
              else if (component === "lipídios") food.lipid_g = val;
            }
          }
          temp.push(food);
        }
      } catch { /* skip malformed lines */ }
    }
    return temp;
  } catch (error) {
    console.error("Error loading TBCA.json:", error);
    return [];
  }
}

function hasValidKcal(food: any): boolean {
  const v = food.energy_kcal;
  if (!v || v === 'NA' || v === '*' || v === 'Tr') return false;
  const n = parseFloat(String(v));
  return !isNaN(n) && n > 0;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const db = searchParams.get('db') || 'all';
    const query = searchParams.get('q') || '';
    const lowerQuery = query.toLowerCase();

    const filterFoods = (foods: any[]) =>
      lowerQuery.length >= 2
        ? foods.filter(f => f.description && f.description.toLowerCase().includes(lowerQuery))
        : foods;

    // When a specific DB is requested, use only that one
    if (db === 'taco') {
      const foods = filterFoods(loadTaco());
      return NextResponse.json(foods.slice(0, 50));
    }
    if (db === 'tbca') {
      const foods = filterFoods(loadTbca());
      return NextResponse.json(foods.slice(0, 50));
    }

    // Default: merge both, deduplicate by description, prioritize items with valid kcal
    const tacoFoods = filterFoods(loadTaco());
    const tbcaFoods = filterFoods(loadTbca());

    const seen = new Map<string, any>();

    // Add TACO first
    for (const f of tacoFoods) {
      const key = f.description?.toLowerCase().trim();
      if (!key) continue;
      seen.set(key, f);
    }

    // Add TBCA: override TACO entry only if TBCA has valid kcal and TACO doesn't
    for (const f of tbcaFoods) {
      const key = f.description?.toLowerCase().trim();
      if (!key) continue;
      const existing = seen.get(key);
      if (!existing || (!hasValidKcal(existing) && hasValidKcal(f))) {
        seen.set(key, f);
      }
    }

    const merged = Array.from(seen.values()).slice(0, 50);
    return NextResponse.json(merged);
  } catch (error) {
    console.error("Alimentos API error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

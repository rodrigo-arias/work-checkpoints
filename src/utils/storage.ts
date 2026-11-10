import { LocalStorage } from "@raycast/api";
import crypto from "crypto";
import fs from "fs";
import os from "os";
import path from "path";
import { Checkpoint } from "../types";

const CHECKPOINTS_KEY = "checkpoints";

// JSON file path where Claude Desktop can read the checkpoints
// Not the Raycast support path: that moves when Raycast reorganizes its storage
const JSON_FILE_DIR = path.join(os.homedir(), "Library", "Application Support", "timesheet-assistant");
const JSON_FILE_PATH = path.join(JSON_FILE_DIR, "checkpoints.json");

function ensureDir() {
  if (!fs.existsSync(JSON_FILE_DIR)) {
    fs.mkdirSync(JSON_FILE_DIR, { recursive: true });
  }
}

// Sync checkpoints to a JSON file so external tools (Claude Desktop) can read them
async function syncToFile(checkpoints: Checkpoint[]): Promise<void> {
  ensureDir();
  fs.writeFileSync(JSON_FILE_PATH, JSON.stringify(checkpoints, null, 2), "utf-8");
}

export function getJsonFilePath(): string {
  return JSON_FILE_PATH;
}

// Local calendar date — not toISOString(), which rolls over at 21:00 in Argentina
export function localDateString(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function todayDate(): string {
  return localDateString();
}

export async function getCheckpoints(): Promise<Checkpoint[]> {
  const data = await LocalStorage.getItem<string>(CHECKPOINTS_KEY);
  try {
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Failed to parse checkpoints:", error);
    return [];
  }
}

export async function getTodayCheckpoints(): Promise<Checkpoint[]> {
  const all = await getCheckpoints();
  const today = todayDate();
  return all.filter((c) => c.date === today);
}

export async function getCheckpointsByDate(date: string): Promise<Checkpoint[]> {
  const all = await getCheckpoints();
  return all.filter((c) => c.date === date);
}

export async function getCurrentWeekCheckpoints(): Promise<Checkpoint[]> {
  const all = await getCheckpoints();
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((day + 6) % 7));
  monday.setHours(0, 0, 0, 0);
  const mondayStr = localDateString(monday);
  return all.filter((c) => c.date >= mondayStr);
}

async function saveCheckpoints(checkpoints: Checkpoint[]): Promise<void> {
  await LocalStorage.setItem(CHECKPOINTS_KEY, JSON.stringify(checkpoints));
  await syncToFile(checkpoints);
}

export async function addCheckpoint(description: string): Promise<Checkpoint> {
  const checkpoints = await getCheckpoints();
  const now = new Date();
  const newCheckpoint: Checkpoint = {
    id: crypto.randomUUID(),
    timestamp: now.toISOString(),
    description: description.trim(),
    date: todayDate(),
  };
  await saveCheckpoints([...checkpoints, newCheckpoint]);
  return newCheckpoint;
}

export async function updateCheckpoint(id: string, description: string): Promise<void> {
  const checkpoints = await getCheckpoints();
  const updated = checkpoints.map((c) => (c.id === id ? { ...c, description: description.trim() } : c));
  await saveCheckpoints(updated);
}

export async function deleteCheckpoint(id: string): Promise<void> {
  const checkpoints = await getCheckpoints();
  const filtered = checkpoints.filter((c) => c.id !== id);
  await saveCheckpoints(filtered);
}

export async function clearTodayCheckpoints(): Promise<void> {
  const checkpoints = await getCheckpoints();
  const today = todayDate();
  const filtered = checkpoints.filter((c) => c.date !== today);
  await saveCheckpoints(filtered);
}

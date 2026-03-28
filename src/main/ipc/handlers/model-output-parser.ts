import type { ModelInfo, ModelVariantInfo } from '../../../shared/ipc';

export interface ParseResult {
  models: string[];
  modelInfos: ModelInfo[];
}

function isBlankLine(line: string): boolean {
  return line.trim().length === 0;
}

function isNoiseLine(line: string): boolean {
  if (line.length === 0) return true;
  const firstChar = line[0];
  if (firstChar === ' ' || firstChar === '\t') return true;
  const trimmed = line.trim();
  if (trimmed.length === 0) return true;
  if (trimmed.startsWith('[')) return true;
  if (trimmed.startsWith('{')) return true;
  if (trimmed.startsWith('"')) return true;
  if (/^\d+$/.test(trimmed)) return true;
  if (!/[/\-_0-9]/.test(trimmed)) return true;
  return false;
}

function isValidModelId(line: string): boolean {
  if (line.length === 0) return false;
  if (isNoiseLine(line)) return false;
  return true;
}

function findJsonBlockStart(lines: string[], startIndex: number): number {
  for (let i = startIndex; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (isBlankLine(trimmed)) continue;
    if (trimmed.startsWith('{')) return i;
    break;
  }
  return -1;
}

function findJsonBlockEnd(lines: string[], startIndex: number): number {
  let braceCount = 0;
  let inString = false;
  let escaped = false;

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i];
    for (let j = 0; j < line.length; j++) {
      const ch = line[j];

      if (escaped) {
        escaped = false;
        continue;
      }

      if (ch === '\\' && inString) {
        escaped = true;
        continue;
      }

      if (ch === '"' && !escaped) {
        inString = !inString;
        continue;
      }

      if (inString) continue;

      if (ch === '{') braceCount++;
      if (ch === '}') {
        braceCount--;
        if (braceCount === 0) return i;
      }
    }
  }
  return -1;
}

function tryParseJson(jsonStr: string): { providerID: string; name: string; variants: ModelVariantInfo } | null {
  try {
    const parsed = JSON.parse(jsonStr);
    if (typeof parsed !== 'object' || parsed === null) return null;
    return {
      providerID: typeof parsed.providerID === 'string' ? parsed.providerID : '',
      name: typeof parsed.name === 'string' ? parsed.name : '',
      variants: typeof parsed.variants === 'object' && parsed.variants !== null ? (parsed.variants as ModelVariantInfo) : {},
    };
  } catch {
    // Invalid JSON - ignore this metadata block
    return null;
    return null;
  }
}

export function parseModelOutput(stdout: string): ParseResult {
  const lines = stdout.split('\n');
  const models: string[] = [];
  const modelInfos: ModelInfo[] = [];
  const seenModelIds = new Set<string>();

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    if (isBlankLine(line)) {
      i++;
      continue;
    }

    if (!isValidModelId(line)) {
      i++;
      continue;
    }

    const modelId = line.trim();

    const jsonStart = findJsonBlockStart(lines, i + 1);

    if (jsonStart === -1) {
      if (!seenModelIds.has(modelId)) {
        seenModelIds.add(modelId);
        models.push(modelId);
      }
      i++;
      continue;
    }

    const jsonEnd = findJsonBlockEnd(lines, jsonStart);

    if (jsonEnd === -1) {
      if (!seenModelIds.has(modelId)) {
        seenModelIds.add(modelId);
        models.push(modelId);
      }
      i++;
      continue;
    }

    const jsonStr = lines.slice(jsonStart, jsonEnd + 1).join('\n');
    const parsedJson = tryParseJson(jsonStr);

    if (!seenModelIds.has(modelId)) {
      seenModelIds.add(modelId);
      models.push(modelId);
      if (parsedJson) {
        modelInfos.push({
          id: modelId,
          providerID: parsedJson.providerID,
          name: parsedJson.name || modelId,
          variants: parsedJson.variants,
        });
      }
    }

    i = jsonEnd + 1;
  }

  return { models, modelInfos };
}

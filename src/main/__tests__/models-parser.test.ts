import { describe, it, expect } from 'vitest';
import { parseModelOutput } from '../ipc/handlers/model-output-parser';

describe('ModelOutputParser', () => {
  describe('parseModelOutput', () => {
    it('happy path: model with valid JSON metadata', () => {
      const output = `minimax-coding-plan/MiniMax-M2
{
  "providerID": "minimax-coding-plan",
  "name": "MiniMax-M2",
  "variants": { "low": {}, "medium": {} }
}`;
      const result = parseModelOutput(output);

      expect(result.models).toEqual(['minimax-coding-plan/MiniMax-M2']);
      expect(result.modelInfos).toHaveLength(1);
      expect(result.modelInfos[0]).toEqual({
        id: 'minimax-coding-plan/MiniMax-M2',
        providerID: 'minimax-coding-plan',
        name: 'MiniMax-M2',
        variants: { low: {}, medium: {} },
      });
    });

    it('model without JSON metadata', () => {
      const output = `claude-3-5-sonnet
another-model`;
      const result = parseModelOutput(output);

      expect(result.models).toEqual(['claude-3-5-sonnet', 'another-model']);
      expect(result.modelInfos).toHaveLength(0);
    });

    it('multiple models with mixed metadata presence', () => {
      const output = `minimax-coding-plan/MiniMax-M2
{
  "providerID": "minimax-coding-plan",
  "name": "MiniMax-M2",
  "variants": { "low": {}, "medium": {} }
}
claude-3-5-sonnet
{
  "providerID": "anthropic",
  "name": "Claude 3.5 Sonnet",
  "variants": { "medium": {}, "high": {} }
}
gpt-4`;
      const result = parseModelOutput(output);

      expect(result.models).toEqual([
        'minimax-coding-plan/MiniMax-M2',
        'claude-3-5-sonnet',
        'gpt-4',
      ]);
      expect(result.modelInfos).toHaveLength(2);
      expect(result.modelInfos[0].id).toBe('minimax-coding-plan/MiniMax-M2');
      expect(result.modelInfos[1].id).toBe('claude-3-5-sonnet');
    });

    it('JSON content never appears in models array', () => {
      const output = `minimax-coding-plan/MiniMax-M2
{
  "providerID": "minimax-coding-plan",
  "name": "MiniMax-M2",
  "variants": { "low": {}, "medium": {} }
}`;
      const result = parseModelOutput(output);

      const jsonLines = output.split('\n').filter(l => l.trim().startsWith('{'));
      jsonLines.forEach(jsonLine => {
        expect(result.models).not.toContain(jsonLine.trim());
      });
    });

    it('single model with complete JSON block', () => {
      const output = `claude-3-5-sonnet
{
  "providerID": "anthropic",
  "name": "Claude 3.5 Sonnet",
  "variants": {
    "medium": { "temperature": 0.7 },
    "high": { "temperature": 0.9 }
  }
}`;
      const result = parseModelOutput(output);

      expect(result.models).toEqual(['claude-3-5-sonnet']);
      expect(result.modelInfos).toHaveLength(1);
      expect(result.modelInfos[0].providerID).toBe('anthropic');
      expect(result.modelInfos[0].name).toBe('Claude 3.5 Sonnet');
    });

    it('filters out Agent Usage Reminder lines', () => {
      const output = `minimax-coding-plan/MiniMax-M2
{
  "providerID": "minimax-coding-plan",
  "name": "MiniMax-M2",
  "variants": {}
}
[Agent Usage Reminder: Something]
claude-3-5-sonnet`;
      const result = parseModelOutput(output);

      expect(result.models).toEqual([
        'minimax-coding-plan/MiniMax-M2',
        'claude-3-5-sonnet',
      ]);
    });

    it('filters out lines starting with spaces', () => {
      const output = `minimax-coding-plan/MiniMax-M2
   indented line
   "this is not a model"
gpt-4`;
      const result = parseModelOutput(output);

      expect(result.models).toEqual([
        'minimax-coding-plan/MiniMax-M2',
        'gpt-4',
      ]);
    });

    it('handles empty input', () => {
      const result = parseModelOutput('');

      expect(result.models).toEqual([]);
      expect(result.modelInfos).toEqual([]);
    });

    it('handles only whitespace', () => {
      const result = parseModelOutput('   \n\n   \n');

      expect(result.models).toEqual([]);
      expect(result.modelInfos).toEqual([]);
    });

    it('handles invalid JSON gracefully', () => {
      const output = `minimax-coding-plan/MiniMax-M2
{ invalid json }`;
      const result = parseModelOutput(output);

      expect(result.models).toEqual(['minimax-coding-plan/MiniMax-M2']);
      expect(result.modelInfos).toHaveLength(0);
    });

    it('malformed JSON with missing comma does not create fake JSON model entry', () => {
      const output = `gpt-4
{
  "providerID": "openai"
  "variants": { "medium": {} }
}`;
      const result = parseModelOutput(output);

      expect(result.models).toEqual(['gpt-4']);
      expect(result.modelInfos).toHaveLength(0);
      expect(result.models).not.toContain('{');
      expect(result.models).not.toContain('"providerID"');
    });

    it('duplicate model ids are deduplicated - first occurrence kept', () => {
      const output = `deepseek/deepseek-chat
{
  "providerID": "deepseek"
}
deepseek/deepseek-chat
{
  "providerID": "deepseek",
  "name": "DeepSeek Chat V2"
}`;
      const result = parseModelOutput(output);

      expect(result.models).toEqual(['deepseek/deepseek-chat']);
      expect(result.models.filter((m) => m === 'deepseek/deepseek-chat')).toHaveLength(1);
      expect(result.modelInfos).toHaveLength(1);
      expect(result.modelInfos[0].name).toBe('deepseek/deepseek-chat');
    });

    it('duplicate model without JSON - first occurrence kept', () => {
      const output = `claude-3-5-sonnet
claude-3-5-sonnet
claude-3-5-sonnet`;
      const result = parseModelOutput(output);

      expect(result.models).toEqual(['claude-3-5-sonnet']);
      expect(result.models).toHaveLength(1);
    });

    it('skip blank lines between blocks', () => {
      const output = `minimax-coding-plan/MiniMax-M2
{
  "providerID": "minimax"
}


claude-3-5-sonnet

{
  "providerID": "anthropic"
}`;
      const result = parseModelOutput(output);

      expect(result.models).toEqual([
        'minimax-coding-plan/MiniMax-M2',
        'claude-3-5-sonnet',
      ]);
      expect(result.modelInfos).toHaveLength(2);
    });

    it('skip lines starting with [', () => {
      const output = `[Agent Usage Reminder]
minimax-coding-plan/MiniMax-M2
{
  "providerID": "minimax"
}
[Another Warning]
claude-3-5-sonnet`;
      const result = parseModelOutput(output);

      expect(result.models).toEqual([
        'minimax-coding-plan/MiniMax-M2',
        'claude-3-5-sonnet',
      ]);
      expect(result.models).not.toContain('[Agent Usage Reminder]');
      expect(result.models).not.toContain('[Another Warning]');
    });

    it('handle JSON with missing closing brace', () => {
      const output = `gpt-4
{
  "providerID": "openai"
  "variants": { "medium": {} }`;
      const result = parseModelOutput(output);

      expect(result.models).toEqual(['gpt-4']);
      expect(result.modelInfos).toHaveLength(0);
    });

    it('handle JSON with extra opening braces', () => {
      const output = `gpt-4
{{
  "providerID": "openai"
}}`;
      const result = parseModelOutput(output);

      expect(result.models).toEqual(['gpt-4']);
      expect(result.modelInfos).toHaveLength(0);
    });

    it('noise lines are not treated as models', () => {
      const output = `minimax-coding-plan/MiniMax-M2
some noise line
another noise
"json string"
   indented
[Agent Reminder]
minimax-coding-plan/MiniMax-M2`;
      const result = parseModelOutput(output);

      expect(result.models).toEqual(['minimax-coding-plan/MiniMax-M2']);
      expect(result.models).not.toContain('some noise line');
      expect(result.models).not.toContain('another noise');
      expect(result.models).not.toContain('"json string"');
    });

    it('handles numbers-only lines as noise', () => {
      const output = `gpt-4
12345
claude-3-5-sonnet`;
      const result = parseModelOutput(output);

      expect(result.models).toEqual(['gpt-4', 'claude-3-5-sonnet']);
      expect(result.models).not.toContain('12345');
    });
  });
});

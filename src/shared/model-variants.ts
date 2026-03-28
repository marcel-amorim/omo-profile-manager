import type { VariantOption } from './constants';
import { VARIANT_OPTIONS } from './constants';
import type { ModelInfo } from './ipc';

export interface ModelVariantOption {
  value: VariantOption;
  label: string;
}

const MODEL_VARIANT_LABEL_ALIASES: Partial<Record<VariantOption, string[]>> = {
  xhigh: ['max'],
};

export function getModelVariantOptions(modelInfo?: ModelInfo): ModelVariantOption[] {
  if (!modelInfo) {
    return [];
  }

  const availableVariants = new Set(Object.keys(modelInfo.variants));

  return VARIANT_OPTIONS.flatMap((variant) => {
    if (availableVariants.has(variant)) {
      return [{ value: variant, label: variant }];
    }

    const alias = MODEL_VARIANT_LABEL_ALIASES[variant]?.find((candidate) => availableVariants.has(candidate));
    if (!alias) {
      return [];
    }

    return [{ value: variant, label: alias }];
  });
}

export function getModelVariantDisplayLabel(variant: VariantOption, modelInfo?: ModelInfo): string {
  const matchingOption = getModelVariantOptions(modelInfo).find((option) => option.value === variant);
  return matchingOption?.label ?? variant;
}

import { watch, ref, reactive, Ref, isRef, toRefs, computed } from '@vue/composition-api';
import { validate } from 'vee-validate';
import { ValidationFlags, ValidationResult } from 'vee-validate/dist/types/types';
import { FormController } from './useForm';
import { Flag } from './types';
import { debounce } from './utils';
import { DELAY } from './constants';

type RuleExp = string | Record<string, any>;

interface FieldOptions {
  value: Ref<any>;
  rules: RuleExp | Ref<RuleExp>;
  form?: FormController;
}

type FieldAugmentedOptions = string | Ref<any> | FieldOptions;

export function useFlags() {
  const flags: ValidationFlags = reactive(createFlags());
  const passed = computed(() => {
    return flags.valid && flags.validated;
  });

  const failed = computed(() => {
    return flags.invalid && flags.validated;
  });

  return {
    ...toRefs(flags),
    passed,
    failed
  };
}

export function useField(fieldName: string, opts?: FieldAugmentedOptions) {
  const errors: Ref<string[]> = ref([]);
  const { value, rules, form } = normalizeOptions(opts);
  const initialValue = value.value;
  const flags = useFlags();

  const validateField = async (newVal: Ref<any>): Promise<ValidationResult> => {
    flags.pending.value = true;
    const result = await validate(newVal.value, isRef(rules) ? rules.value : rules, {
      name: fieldName,
      values: form?.valueRecords ?? {}
    });

    errors.value = result.errors;
    flags.changed.value = initialValue !== value.value;
    flags.valid.value = result.valid;
    flags.invalid.value = !result.valid;
    flags.validated.value = true;
    flags.pending.value = false;

    return result;
  };

  const handler = debounce(DELAY, validateField);

  watch(value, handler, {
    lazy: true
  });

  if (isRef(rules)) {
    watch(rules as Ref<any>, handler, {
      lazy: true
    });
  }

  const reset = () => {
    const defaults = createFlags();
    Object.keys(flags).forEach((key: string) => {
      flags[key as Flag].value = defaults[key as Flag];
    });

    errors.value = [];
  };

  const onBlur = () => {
    flags.touched.value = true;
    flags.untouched.value = false;
  };

  const onInput = () => {
    flags.dirty.value = true;
    flags.pristine.value = false;
  };

  const field = {
    vid: fieldName,
    value,
    ...flags,
    errors,
    reset,
    validate: validateField,
    onInput,
    onBlur
  };

  form?.register(field);

  return field;
}

function normalizeOptions(opts: FieldAugmentedOptions | undefined): FieldOptions {
  const defaults = {
    value: ref(''),
    rules: ''
  };

  if (!opts) {
    return defaults;
  }

  if (isRef(opts)) {
    return {
      ...defaults,
      rules: opts
    };
  }

  return {
    ...defaults,
    rules: opts
  };
}

function createFlags(): Record<Flag, boolean> {
  return {
    changed: false,
    valid: false,
    invalid: false,
    touched: false,
    untouched: true,
    dirty: false,
    pristine: true,
    validated: false,
    pending: false,
    required: false,
    passed: false,
    failed: false
  };
}

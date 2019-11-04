import { watch, ref, reactive, Ref, isRef, toRefs, computed, onMounted } from '@vue/composition-api';
import { validate } from 'vee-validate';
import { ValidationFlags, ValidationResult } from 'vee-validate/dist/types/types';
import { FormController } from './useForm';
import { Flag } from './types';
import { debounce, hasRefs } from './utils';
import { DELAY } from './constants';

type RuleExp = string | Record<string, any>;

interface FieldOptions {
  value: Ref<any>;
  rules: RuleExp | Ref<RuleExp>;
  immediate: boolean;
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
  const { value, rules, form, immediate } = normalizeOptions(opts);
  const initialValue = value.value;
  const flags = useFlags();

  function commitResult(result: ValidationResult) {
    errors.value = result.errors;
    flags.changed.value = initialValue !== value.value;
    flags.valid.value = result.valid;
    flags.invalid.value = !result.valid;
    flags.validated.value = true;
    flags.pending.value = false;
  }

  const validateField = async (newVal: Ref<any>): Promise<ValidationResult> => {
    flags.pending.value = true;
    const result = await validate(newVal.value, isRef(rules) ? rules.value : rules, {
      name: fieldName,
      values: form?.valueRecords ?? {}
    });

    commitResult(result);

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
  } else if (hasRefs(rules)) {
    Object.keys(rules).forEach(key => {
      if (!isRef(rules[key])) {
        return;
      }

      watch(rules[key], handler, { lazy: true });
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

  onMounted(() => {
    validate(initialValue, isRef(rules) ? rules.value : rules).then(result => {
      if (immediate) {
        commitResult(result);
        return;
      }

      // Initial silent validation.
      flags.valid.value = result.valid;
      flags.invalid.value = !result.valid;
    });
  });

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
    immediate: false,
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

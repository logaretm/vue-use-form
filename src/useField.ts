import { watch, ref, reactive, Ref, isRef, toRefs } from '@vue/composition-api';
import { validate } from 'vee-validate';
import { ValidationFlags, ValidationResult } from 'vee-validate/dist/types/types';
import { FormController } from './useForm';

const createFlags = (): ValidationFlags => ({
  changed: false,
  valid: false,
  invalid: false,
  touched: false,
  untouched: true,
  dirty: false,
  pristine: true,
  validated: false,
  pending: false,
  required: false
});

type RuleExp = string | Record<string, any>;

interface FieldOptions {
  value: Ref<any>;
  rules: RuleExp | Ref<RuleExp>;
  form?: FormController;
}

function defaultOpts (): FieldOptions {
  return {
    value: ref(''),
    rules: ''
  };
}

export function useField(fieldName: string, opts: string | FieldOptions = defaultOpts()) {
  const errors: Ref<string[]> = ref([]);
  const flags: ValidationFlags = reactive(createFlags());
  let normalizedOpts: FieldOptions;
  if (typeof opts === 'string') {
    const defOpts = defaultOpts();
    normalizedOpts = {
      ...defOpts,
      rules: opts
    };
  } else {
    normalizedOpts = opts;
  }

  const { value, rules } = normalizedOpts;
  const initialValue = value.value;

  const validateField = async (): Promise<ValidationResult> => {
    flags.pending = true;
    const result = await validate(value.value, isRef(rules) ? rules.value : rules, {
      name: fieldName,
      values: normalizedOpts.form && normalizedOpts.form._valueRecords
    });

    errors.value = result.errors;
    flags.changed = initialValue !== value.value;
    flags.valid = result.valid;
    flags.invalid = !result.valid;
    flags.validated = true;
    flags.pending = false;

    return result;
  }

  watch(value, () => validateField(), {
    lazy: true
  });

  if (isRef(rules)) {
    watch(rules, () => validateField(), {
      lazy: true
    });
  }

  const reset = () => {
    const defaults = createFlags();
    Object.keys(flags).forEach(key => {
      flags[key] = defaults[key];
    });

    errors.value = [];
  };

  const onBlur = () => {
    flags.touched = true;
    flags.untouched = false;
  };

  const onInput = () => {
    flags.dirty = true;
    flags.pristine = false;
  }

  const field = {
    vid: fieldName,
    value,
    ...toRefs(flags),
    errors,
    reset,
    validate: validateField,
    onInput,
    onBlur
  };

  if (normalizedOpts.form) {
    normalizedOpts.form._register(field);
  }

  return field;
}

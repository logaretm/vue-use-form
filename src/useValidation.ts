import { watch, ref, reactive, Ref, isRef } from '@vue/composition-api';
import { validate } from 'vee-validate';
import { ValidationFlags } from 'vee-validate/dist/types/types';

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

export function useValidation<T>(valueRef: Ref<T>, rules: RuleExp | Ref<RuleExp>) {
  const errors: Ref<string[]> = ref([]);
  const flags: ValidationFlags = reactive(createFlags());
  const initialValue = valueRef.value;

  const validateVal = async () => {
    flags.pending = true;
    const result = await validate(valueRef.value, isRef(rules) ? rules.value : rules);
    errors.value = result.errors;
    flags.changed = initialValue !== valueRef.value;
    flags.valid = result.valid;
    flags.invalid = !result.valid;
    flags.validated = true;
    flags.pending = false;
  }

  watch(valueRef, () => validateVal(), {
    lazy: true
  });

  if (isRef(rules)) {
    watch(rules, () => validateVal(), {
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

  return {
    flags,
    errors,
    reset,
    validate: validateVal,
    onInput,
    onBlur
  };
}

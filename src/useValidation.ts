import { watch, ref, reactive, Ref } from '@vue/composition-api';
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
})

export function useValidation<T>(valueRef: Ref<T>, rules: string) {
  const errors: Ref<string[]> = ref([]);
  const flags: ValidationFlags = reactive(createFlags());

  const validateVal = async (value: any) => {
    const result = await validate(value, rules);
    errors.value = result.errors;
    flags.valid = result.valid;
    flags.invalid = !result.valid;
    flags.validated = true;
  }

  watch(valueRef, (val) => {
    validateVal(val);
  }, {
    lazy: true
  });

  const reset = () => {
    const defaults = createFlags();
    Object.keys(flags).forEach(key => {
      flags[key] = defaults[key];
    });

    errors.value = [];
  };

  return {
    flags,
    errors,
    reset,
    validate: validateVal
  };
}

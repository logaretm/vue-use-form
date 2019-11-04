import { computed, ref, Ref } from '@vue/composition-api';

export interface FormController {
  _register: (field: { vid: string }) => any;
  _valueRecords: Record<string, any>;
}

interface FormOptions {}

type CoreFlag = 'valid' | 'invalid' | 'validated' | 'dirty' | 'pristine' | 'pending' | 'touched' | 'untouched';
type Flag = CoreFlag | 'passed' | 'failed';

const mergeStrategies: Record<CoreFlag, 'every' | 'some'> = {
  valid: 'every',
  invalid: 'some',
  dirty: 'some',
  pristine: 'every',
  touched: 'some',
  untouched: 'every',
  pending: 'some',
  validated: 'every'
};

function computeFlags(fields: Ref<any[]>) {
  const flags: CoreFlag[] = Object.keys(mergeStrategies) as CoreFlag[];

  const computedFlags = flags.reduce(
    (acc, flag: CoreFlag) => {
      acc[flag] = computed(() => {
        return fields.value[mergeStrategies[flag]](field => field[flag]);
      });

      return acc;
    },
    {} as Record<Flag, Ref<boolean>>
  );

  computedFlags.passed = computed(() => {
    return computedFlags.valid.value && computedFlags.validated.value;
  });

  computedFlags.failed = computed(() => {
    return computedFlags.invalid.value && computedFlags.validated.value;
  });

  return computedFlags;
}

interface FormComposite {
  form: FormController;
  reset: () => void;
  handleSubmit: (fn: Function) => Promise<any>;
  validate: () => Promise<boolean>;
}

export function useForm(opts?: FormOptions): FormComposite {
  const fields: Ref<object[]> = ref([]);
  const fieldsById: Record<string, any> = {}; // for faster access
  const controller: FormController = {
    _register(field) {
      fields.value.push(field);
      fieldsById[field.vid] = field;
    },
    get _valueRecords() {
      return fields.value.reduce((acc: any, field: any) => {
        acc[field.vid] = field.value.value;

        return acc;
      }, {});
    }
  };

  const validate = async () => {
    const results = await Promise.all(
      fields.value.map((f: any) => {
        return f.validate();
      })
    );

    return results.every(r => r.valid);
  };

  const reset = () => {
    fields.value.forEach((f: any) => f.reset());
  };

  return {
    ...computeFlags(fields),
    form: controller,
    validate,
    reset,
    handleSubmit: (fn: Function) => {
      return validate().then(result => {
        if (result && typeof fn === 'function') {
          return fn();
        }
      });
    }
  };
}

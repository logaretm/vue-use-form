import { computed, ref, Ref } from '@vue/composition-api';
import { Flag } from './types';

export interface FormController {
  register: (field: { vid: string }) => any;
  valueRecords: Record<string, any>;
}

interface FormOptions {}

const mergeStrategies: Record<Flag, 'every' | 'some'> = {
  valid: 'every',
  invalid: 'some',
  dirty: 'some',
  pristine: 'every',
  touched: 'some',
  untouched: 'every',
  pending: 'some',
  validated: 'every',
  changed: 'some',
  passed: 'every',
  failed: 'some',
  required: 'some'
};

function computeFlags(fields: Ref<any[]>) {
  const flags: Flag[] = Object.keys(mergeStrategies) as Flag[];

  return flags.reduce(
    (acc, flag: Flag) => {
      acc[flag] = computed(() => {
        return fields.value[mergeStrategies[flag]](field => field[flag]);
      });

      return acc;
    },
    {} as Record<Flag, Ref<boolean>>
  );
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
    register(field) {
      fields.value.push(field);
      fieldsById[field.vid] = field;
    },
    get valueRecords() {
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

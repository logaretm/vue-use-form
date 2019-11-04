import { computed, ref, Ref } from '@vue/composition-api';
import { Flag, FormController } from './types';

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
  errors: Ref<Record<string, string[]>>;
  reset: () => void;
  handleSubmit: (fn: Function) => Promise<any>;
  validate: () => Promise<boolean>;
}

export function useForm(opts?: FormOptions): FormComposite {
  const fields: Ref<any[]> = ref([]);
  const fieldsById: Record<string, any> = {}; // for faster access
  const controller: FormController = {
    register(field) {
      fields.value.push(field);
      fieldsById[field.vid] = field;
      // TODO: Register watchers for cross field validation.
      // Requires: vee-validate exposed normalizeRules function to map fields.
    },
    get valueRecords() {
      return fields.value.reduce((acc: any, field: any) => {
        acc[field.vid] = field.model.value;

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

  const errors = computed(() => {
    return fields.value.reduce((acc: Record<string, string[]>, field) => {
      acc[field.vid] = field.errors.value;

      return acc;
    }, {});
  });

  const reset = () => {
    fields.value.forEach((f: any) => f.reset());
  };

  return {
    errors,
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

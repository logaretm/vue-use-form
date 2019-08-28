# vue-use-form

This is a [Vue composition API](https://github.com/vuejs/composition-api) function that allows you to do form validation, powered by vee-validate.

## Install

**⚠ Not production ready yet. ⚠**

```sh
yarn add vue-use-form

# OR

npm i vue-use-form
```

## Usage

In your component file:

```js
import { ref } from '@vue/composition-api';
import { useForm, useField } from 'vue-use-form';

export default {
  setup() {
    const fname = ref('');
    const { form, submit } = useForm({
      onSubmit () {
        console.log('Submitting!', {
          fname: fname.value
        });
      }
    });

    const { errors } = useField('firstName', {
      rules: 'required',
      value: fname,
      form
    });

    return { fname, errors, submit };
  }
};
```

In your Template:

```vue
<form @submit.prevent="submit">
  <input v-model="fname">
  <span>{{ errors[0] }}</span>
  <button>Submit</button>
</form>
```

## API

### useValidation(ref, string | ref)

The `useValidation` method accepts a ref which is the input initial value, and a rules expression which can be a string or a ref for a string.

It returns the following members:

| Prop     | Type                   | Description                                                                            |
| -------- | ---------------------- | -------------------------------------------------------------------------------------- |
| flags    | ValidationFlags        | Object containing vee-validate flags for that field.                                   |
| errors   | string[]               | list of validation errors                                                              |
| validate | () => ValidationResult | Triggers validation for the field.                                                     |
| reset    | () => void             | Resets validation state for the field.                                                 |
| onInput  | () => void             | Updates some flags when the user inputs, you should bind it to the element.            |
| onBlur   | () => void             | Updates some flags when the user focuses the field, you should bind it to the element. |

## License

MIT

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

### useForm(object)

The `useForm` function accepts options to configure the form.

```js
const { form, submit } = useForm({
  onSubmit () {
    // this will only run when the form is valid.
    // send to server!
  }
});
```

It returns an object containing two properties:

- `form`: A form controller object, which can be used with `useField` to associate fields in the same form.
- `submit`: A safe form submit handler to bind to your submission handler, it will validate all the fields before it runs the given `onSubmit` handler.

### useField(string, string | object)

The `useField` function accepts a `string` which is the input name, and options to configure the field:

```js
const field = useField('firstName', {
  rules: 'required', // vee-validate style rules, can be a Ref<string>.
  value: fname, // the initial field value, optional.
  form // a form controller object returned from "useForm", used to group fields. optional.
});
```

It returns the following members:

| Prop     | Type                   | Description                                                                            |
| -------- | ---------------------- | -------------------------------------------------------------------------------------- |
| flags    | `ValidationFlags`        | Object containing vee-validate flags for that field.                                   |
| errors   | `string[]`               | list of validation errors                                                              |
| validate | `() => ValidationResult` | Triggers validation for the field.                                                     |
| reset    | `() => void`             | Resets validation state for the field.                                                 |
| onInput  | `() => void`             | Updates some flags when the user inputs, you should bind it to the element.            |
| onBlur   | `() => void`             | Updates some flags when the user focuses the field, you should bind it to the element. |
| value   | `Ref<string>`  | A default ref in-case you didn't pass the initial value |

## Credits

- API Inspired by some react libraries: [Formik](https://jaredpalmer.com/formik/), [react-final-form-hooks](https://github.com/final-form/react-final-form-hooks).
- Powered by [vee-validate](https://github.com/baianat/vee-validate).

## License

MIT

// @flow
import React from 'react';
import get from 'lodash.get';
import isEmpty from 'lodash.isempty';
import isFunction from 'lodash.isfunction';
import set from 'lodash.set';

type CommonTypes = {
  onSubmit: (Object, ?Function) => void,
};

type ErrorsType = Array<{ name: string, message: string }>;

export type FormConfig = {
  ...CommonTypes,
  initialValues: Object,
  validations: Function | Object,
};

export type FormProps = {
  ...CommonTypes,
  values: Object,
  errors: ErrorsType,
  onChange: (string, string | number | Object) => void,
  getErrors: (string) => ErrorsType,
};

const useForm: (FormConfig) => FormProps = (config) => {
  const { initialValues = {}, onSubmit } = config;

  const [values, setValues] = React.useState(initialValues);

  const [errors, setErrors] = React.useState([]);

  const update = (name, value) => {
    const newValues = { ...values };
    set(newValues, name, value);
    setValues(newValues);
  };

  const validate = () => {
    const errorsArr = [];

    const { validations } = config;

    const validationsObj = isFunction(validations)
      ? validations(values)
      : validations;

    const isEmptyValue = (value) => {
      switch (typeof value) {
        case 'boolean':
          return value !== true;

        case 'number': {
          return value >= 0;
        }

        default:
          return isEmpty(value);
      }
    };

    Object.keys(validationsObj).forEach((key) => {
      const value = get(values, key);

      const validation = get(validationsObj, key);

      if (validation.required && isEmptyValue(value)) {
        errorsArr.push({
          name: key,
          message: validation.message || 'This input is invalid.',
        });
      } else if (validation.rules) {
        validation.rules.every((rule) => {
          const { validator, message } = rule;

          if (!validator(value, values)) {
            errorsArr.push({
              name: key,
              message,
            });

            return false;
          }

          return true;
        });
      }
    });

    setErrors(errorsArr);

    return isEmpty(errorsArr);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (validate()) {
      onSubmit(values, () => {
        setValues(initialValues);
      });
    }
  };

  const getErrors = (key) => errors.filter(({ name }) => name === key);

  return {
    values,
    errors,
    onChange: update,
    onSubmit: handleSubmit,
    getErrors,
  };
};

export default useForm;

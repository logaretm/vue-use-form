export type Flag =
  | 'valid'
  | 'invalid'
  | 'validated'
  | 'dirty'
  | 'pristine'
  | 'pending'
  | 'touched'
  | 'untouched'
  | 'changed'
  | 'required'
  | 'passed'
  | 'failed';

export interface FormController {
  register: (field: { vid: string }) => any;
  valueRecords: Record<string, any>;
}

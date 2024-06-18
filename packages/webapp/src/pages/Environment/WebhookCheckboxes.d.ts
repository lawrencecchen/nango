/// <reference types="react" />
import type { WebhookSettings as CheckboxState } from '@nangohq/types';
interface CheckboxFormProps {
    env: string;
    mutate: () => void;
    checkboxState: CheckboxState;
    setCheckboxState: React.Dispatch<React.SetStateAction<CheckboxState>>;
}
declare const CheckboxForm: React.FC<CheckboxFormProps>;
export default CheckboxForm;

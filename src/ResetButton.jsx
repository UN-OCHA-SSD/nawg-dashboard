import React from 'react';
import {ArrowCounterClockwise} from '@phosphor-icons/react';

export function ResetButton({onReset, title='Restore default filters, latest covered cycle, Twic East and page controls. Keep the current evidence source and theme.'}){
 return <button type="button" className="secondary reset-filters" onClick={onReset} title={title}><ArrowCounterClockwise aria-hidden="true"/>Reset</button>;
}

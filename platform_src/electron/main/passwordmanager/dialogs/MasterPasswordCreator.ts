import { BrowserWindow } from 'electron';
import { PasswordManager } from '../PasswordManager';

export type OnCancelClickedListener = () => void;
export type OnNextClickedListener = (password: string, shouldSavePasswordToBiometric: boolean) => void;
export type OnDontUseMasterPasswordListener = () => void;
export type OnErrorListener = (error: string) => void; 

export class MasterPasswordCreator {

}

export namespace MasterPasswordCreator {
    export class Builder {
        private window: BrowserWindow;
        private passwordManager: PasswordManager;
        private onCancelClickedListener: OnCancelClickedListener;
        private onNextClickedListener: OnNextClickedListener;
        private onErrorListener: OnErrorListener;

        constructor(window: BrowserWindow, passwordManager: PasswordManager) {
            this.window = window;
            this.passwordManager = passwordManager;
        }

        public setOnCancelClickedListener(listener: OnCancelClickedListener): Builder {
            this.onCancelClickedListener = listener;
            return this;
        }

        public setOnNextClickedListener(listener: OnNextClickedListener): Builder {
            this.onNextClickedListener = listener;
            return this;
        }

        public setOnErrorListener(listener: OnErrorListener): Builder {
            this.onErrorListener = listener;
            return this;
        }

        public prompt() {
            //TODO: implement
        }
    }
}
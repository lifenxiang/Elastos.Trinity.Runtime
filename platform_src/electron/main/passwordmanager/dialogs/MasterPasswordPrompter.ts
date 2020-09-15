
export type OnCancelClickedListener = () => void;
export type OnNextClickedListener = (password: string,shouldSavePasswordToBiometric: boolean ) => void;
export type OnErrorListener= (error: string) => void;

export class MasterPasswordPrompter  {

}

export namespace MasterPasswordPrompter {
    export class Builder {

    }
}
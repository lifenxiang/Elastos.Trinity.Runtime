export class Log {
    static d(tag: string, ...params: any[]) {
        console.log(tag, params);
    }

    static e(tag: string, ...params: any[]) {
        console.error(tag, params);
    }
}
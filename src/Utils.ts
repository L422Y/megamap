// export function reactiveHandler<T>(updateCallback: () => void) {
//     return {
//         get(target: T, prop: keyof T) {
//             return target[prop];
//         },
//         set(target: T, prop: keyof T, value: any) {
//             target[prop] = value;
//             updateCallback(); // Notify or trigger update logic
//             return true;
//         }
//     };
// }
//
// export function createReactiveObject<T>(obj: T): T {
//     return new Proxy(obj, reactiveHandler());
// }

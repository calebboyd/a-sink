import type { ExplicitAny, Func } from './lang.js'

const nativeErrorTypes = [
  EvalError,
  RangeError,
  ReferenceError,
  SyntaxError,
  TypeError,
  URIError,
].filter((x) => typeof x === 'function')

function rejectIfNativeError(error: ExplicitAny) {
  for (const NativeError of nativeErrorTypes) {
    if (error instanceof NativeError) return Promise.reject(error)
  }
}

function valueTuple<T>(arg: T): [null, T] {
  return [null, arg]
}
function errorTuple<E>(error: E): [E, undefined] | Promise<never> {
  const reject = rejectIfNativeError(error)
  return reject ? reject : [error, undefined]
}
/**
 * @public
 */
export type ErrorValue<T, E> = [E, undefined] | [null, T]

/**
 * @public
 * Kind of like nodes ErrBacks, but with the ease (and overhead) of promises.
 * It will only reject promises for native errors.
 * Syncronous errors are caught.
 * @example
 * const [err, value] = await gowait(doWorkThatMightErrorAsync())
 * if (err) {
 *   panic(err)
 * } else {
 *   success(value)
 * }
 *
 * @param promised
 */

export function gowait<K extends Func<Promise<T>>, T, E = Error>(
  func: T,
  ...args: Parameters<K>
): Promise<ErrorValue<T, E>>
export function gowait<K extends Func<Promise<T>>, T, E = Error>(
  promised: Promise<T> | K,
  ...args: T extends Func ? Parameters<K> : never[]
): Promise<ErrorValue<T, E>> {
  if (typeof promised === 'function' && !('then' in promised)) {
    try {
      if (args.length) promised = promised(...args)
      else promised = promised()
    } catch (e: ExplicitAny) {
      return Promise.resolve(errorTuple(e))
    }
  }
  if (typeof promised.then === 'function') {
    return promised.then(valueTuple, errorTuple)
  }
  return Promise.reject(new TypeError(`${promised} is not a promise or promise returning function`))
}

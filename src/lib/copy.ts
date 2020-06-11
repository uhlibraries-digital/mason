/**
 * Takes any object and returns a deep-copy of that object.
 * Important to understand there are limitations to using
 * parse / stringify and some types like 'undefined', 'dates', and
 * 'NaN' are lost in this copy
 * 
 * @param obj 
 */
export const deepCopy = (obj: any): any => {
  return JSON.parse(JSON.stringify(obj))
}
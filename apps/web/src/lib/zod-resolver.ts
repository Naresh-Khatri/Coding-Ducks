// import { toNestErrors, validateFieldsNatively } from "@hookform/resolvers";
// import {
//   FieldError,
//   FieldErrors,
//   appendErrors,
// } from "react-hook-form";
// import { z } from "zod";
//
// // Helper to detect/use Zod 4 error format
// const isZodError = (error: any): error is z.ZodError => {
//   return error instanceof z.ZodError;
// };
//
// // Adapted from @hookform/resolvers/zod/src/zod.ts
// function parseZodIssues(
//   zodErrors: z.ZodIssue[],
//   validateAllFieldCriteria: boolean,
// ) {
//   const errors: Record<string, FieldError> = {};
//
//   for (; zodErrors.length;) {
//     const error = zodErrors[0];
//     const { code, message, path } = error;
//     const _path = path.join('.');
//
//     if (!errors[_path]) {
//       if (error.code === 'invalid_union' && error.unionErrors.length > 0) {
//         // Zod 3/4 union error structure might differ, checking generic ZodError structure
//         // In v4, invalid_union has .errors which is ZodIssue[][]?
//         // The copied code check `error.errors.length > 0`.
//         // Let's support standard ZodError properties.
//         const unionError = error.unionErrors[0].errors[0];
//
//         errors[_path] = {
//           message: unionError.message,
//           type: unionError.code,
//         };
//       } else {
//         errors[_path] = { message, type: code };
//       }
//     }
//
//     // Handle union errors flattening
//     if (error.code === 'invalid_union') {
//       error.unionErrors.forEach((unionError) =>
//         unionError.errors.forEach((e) => zodErrors.push(e)),
//       );
//     }
//
//     if (validateAllFieldCriteria) {
//       const types = errors[_path].types;
//       const messages = types && types[error.code];
//
//       errors[_path] = appendErrors(
//         _path,
//         validateAllFieldCriteria,
//         errors,
//         code,
//         messages
//           ? ([] as string[]).concat(messages as string[], error.message)
//           : error.message,
//       ) as FieldError;
//     }
//
//     zodErrors.shift();
//   }
//
//   return errors;
// }
//
//
// // Simplified Zod Resolver that uses schema methods directly
// export function zodResolver(
//   schema: z.Schema<any, any>,
//   schemaOptions?: any,
//   resolverOptions: {
//     mode?: 'async' | 'sync';
//     raw?: boolean;
//   } = {},
// ) {
//   return async (values: any, _: any, options: any) => {
//     try {
//       const parseFn =
//         resolverOptions.mode === 'sync' ? 'parse' : 'parseAsync';
//
//       // Assume schema has .parse/.parseAsync methods (standard Zod)
//       const data = await schema[parseFn](values, schemaOptions);
//
//       options.shouldUseNativeValidation &&
//         validateFieldsNatively({}, options);
//
//       return {
//         errors: {} as FieldErrors,
//         values: resolverOptions.raw ? Object.assign({}, values) : data,
//       };
//     } catch (error: any) {
//       if (isZodError(error)) {
//         return {
//           values: {},
//           errors: toNestErrors(
//             parseZodIssues(
//               [...error.errors], // copy issues array
//               !options.shouldUseNativeValidation &&
//               options.criteriaMode === 'all',
//             ),
//             options,
//           ),
//         };
//       }
//
//       throw error;
//     }
//   };
// }

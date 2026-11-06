// Validates and replaces req.params / req.query / req.body with parsed values.
// Unknown keys are stripped so controllers only ever see declared fields.
const validate = (schemas) => (req, res, next) => {
  for (const part of ["params", "query", "body"]) {
    if (!schemas[part]) continue;

    const result = schemas[part].safeParse(req[part] ?? {});
    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join(".") || part,
        message: issue.message,
      }));
      return res.status(400).json({ message: errors[0].message, errors });
    }

    // req.query is made writable in index.js (Express 5 defines it as a getter).
    req[part] = result.data;
  }
  return next();
};

module.exports = validate;

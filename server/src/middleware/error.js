export function notFound(req, res) {
  res.status(404).json({ message: 'That route does not exist.' });
}

export function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);
  if (err?.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    return res.status(409).json({ message: `That ${field} is already in use.` });
  }
  const status = err.status || 500;
  res.status(status).json({ message: err.message || 'Something went wrong on the shelf.' });
}

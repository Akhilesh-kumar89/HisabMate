exports.notFound = (req, res) => res.status(404).json({ message: `Route not found: ${req.originalUrl}` });

exports.errorHandler = (err, _req, res, _next) => {
  let status = err.status || 500;
  let message = err.message || 'Server error';
  if (err.name === 'ValidationError') {
    status = 400;
    message = Object.values(err.errors).map((e) => e.message).join('. ');
  } else if (err.name === 'CastError') {
    status = 404;
    message = 'Record not found';
  } else if (err.code === 11000) {
    status = 409;
    message = err.keyPattern?.email ? 'Email is already registered'
      : err.keyPattern?.mobile ? 'A customer with this mobile number already exists'
      : 'Duplicate record';
  }
  if (status === 500) console.error(err);
  res.status(status).json({ message: status === 500 ? 'Server error. Please try again.' : message });
};

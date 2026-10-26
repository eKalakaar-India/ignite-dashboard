class ApiResponse {
  static success(message, data = null, meta = null) {
    return {
      success: true,
      message,
      data,
      meta,
    };
  }

  static error(message, errors = [], statusCode = 500) {
    return {
      success: false,
      message,
      errors,
      statusCode,
    };
  }
}

export default ApiResponse;

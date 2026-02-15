type ZodErrorDetails = {
  field: string;
  message: string;
};

export class ValidationError extends Error {
  details: ZodErrorDetails[];

  constructor(details: ZodErrorDetails[]) {
    super("Validation Failed");
    this.details = details;
  }

  toJSON() {
    return {
      error: "Validation Failed",
      details: this.details,
    };
  }
}

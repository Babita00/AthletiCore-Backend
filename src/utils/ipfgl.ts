const GL_CONSTANTS = {
  male: { A: 1199.72839, B: 102.18609, C: 0.00921 },
  female: { A: 1249.07955, B: 110.0103, C: 0.008731 },
};

export function calculateIPFGLScore(bodyWeight: number, lifted: number, gender: 'male' | 'female') {
  const { A, B, C } = GL_CONSTANTS[gender];
  const denominator = A - B * Math.exp(-C * bodyWeight);
  return denominator <= 0 ? 0 : (lifted * 100) / denominator;
}

export function calculateIPFCoefficient(gender: 'male' | 'female', bodyWeight: number) {
  const { A, B, C } = GL_CONSTANTS[gender];
  const denominator = A - B * Math.exp(-C * bodyWeight);
  return denominator <= 0 ? 0 : 100 / denominator;
}

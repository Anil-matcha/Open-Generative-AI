export async function createDesignBrief(brief) { return { id: Date.now(), ...brief }; }
export async function runDesignAgent(brief) {
  return [{ url: 'https://via.placeholder.com/512', title: 'Design Asset 1' }];
}
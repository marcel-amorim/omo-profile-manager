import { ProfileSchema } from './src/shared/schemas';

const profile = {
  id: Date.now().toString(),
  name: 'Empty Profile',
  description: 'Start from scratch',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  config: {
    agents: {},
    categories: {}
  }
};

const result = ProfileSchema.safeParse(profile);
if (!result.success) {
  console.log(JSON.stringify(result.error.issues, null, 2));
} else {
  console.log("Success!");
}

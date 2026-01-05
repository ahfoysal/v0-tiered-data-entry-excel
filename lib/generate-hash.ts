import bcryptjs from "bcryptjs"

export async function generatePasswordHash(password: string): Promise<string> {
  const salt = await bcryptjs.genSalt(10)
  return bcryptjs.hash(password, salt)
}

// For testing - this generates the hash for "admin123"
// Run this to see the correct hash: npx ts-node lib/generate-hash.ts
if (require.main === module) {
  generatePasswordHash("admin123").then((hash) => {
    console.log("Hash for 'admin123':", hash)
  })
}

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const uploadFileToStorage = async (file, bucket = 'remix-go-assets') => {
  try {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}.${fileExt}`
    const filePath = `uploads/${fileName}`

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file)

    if (error) throw error

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath)

    return { url: publicUrl, path: filePath }
  } catch (error) {
    console.error('Error uploading file:', error)
    throw error
  }
}

export const saveProject = async (projectData) => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('remix_projects')
      .upsert({
        user_id: user.id,
        ...projectData,
        updated_at: new Date().toISOString()
      })

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error saving project:', error)
    throw error
  }
}

export const loadProject = async (projectId) => {
  try {
    const { data, error } = await supabase
      .from('remix_projects')
      .select('*')
      .eq('id', projectId)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error loading project:', error)
    throw error
  }
}

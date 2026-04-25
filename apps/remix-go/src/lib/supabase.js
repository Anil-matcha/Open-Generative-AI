import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Storage bucket for media assets
export const STORAGE_BUCKET = 'remix-media'

// Enhanced media upload function
export const uploadFileToStorage = async (file, bucket = STORAGE_BUCKET, folder = 'uploads') => {
  try {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`
    const filePath = `${folder}/${fileName}`

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) throw error

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath)

    return {
      url: publicUrl,
      path: filePath,
      name: file.name,
      size: file.size,
      type: file.type,
      uploadedAt: new Date().toISOString()
    }
  } catch (error) {
    console.error('Error uploading file:', error)
    throw error
  }
}

// Upload media with specific handling for videos/images
export const uploadMedia = async (file, type = 'media', options = {}) => {
  try {
    const folder = type === 'video' ? 'videos' : type === 'image' ? 'images' : 'media'
    return await uploadFileToStorage(file, STORAGE_BUCKET, folder)
  } catch (error) {
    console.error('Error uploading media:', error)
    throw error
  }
}

// Get media URL
export const getMediaUrl = (path) => {
  const { data } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(path)

  return data.publicUrl
}

// Delete media
export const deleteMedia = async (path) => {
  try {
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([path])

    if (error) throw error
    return data
  } catch (error) {
    console.error('Delete failed:', error)
    throw error
  }
}

// List media files
export const listMedia = async (path = '') => {
  try {
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .list(path)

    if (error) throw error
    return data
  } catch (error) {
    console.error('List failed:', error)
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

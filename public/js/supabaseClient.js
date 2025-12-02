// js/supabaseClient.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

const supabaseUrl = 'https://aojhcmymkphsiaqmipda.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvamhjbXlta3Boc2lhcW1pcGRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2MjA2OTUsImV4cCI6MjA4MDE5NjY5NX0.yH60QjrfBzBODw3yAwDgDzzs5JGA7Y6Lh_cT5rKL-ic'

// Cria e exporta o cliente Supabase
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Exporta para uso em outros módulos
export { supabase }

// Exporta também como padrão para compatibilidade
export default supabase
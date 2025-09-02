-- Create content_sections table for editable page content
CREATE TABLE content_sections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    section_key VARCHAR(100) UNIQUE NOT NULL, -- Unique identifier for the section
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    section_type VARCHAR(50) NOT NULL DEFAULT 'text', -- 'text', 'list', 'card'
    page VARCHAR(50) NOT NULL, -- 'home', 'puppies', 'global'
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX idx_content_sections_page_active ON content_sections(page, is_active);
CREATE INDEX idx_content_sections_key ON content_sections(section_key);

-- Insert default content sections
INSERT INTO content_sections (section_key, title, content, section_type, page, sort_order) VALUES
-- Homepage sections
('about_kennel', 'Om Kennel Speedex', 'Kennel Speedex er et lille, seriøst og passioneret opdræt beliggende i smukke Gilleleje.
Bag kennelen står Tine Arnild, som har været aktiv opdrætter siden 2005 og er uddannet og certificeret gennem Dansk Kennel Klub (DKK).

Gennem årene har vi specialiseret os i opdræt af terriere – herunder bl.a. West Highland White Terriers, Jack Russell Terriers og senest Norfolk Terriers, som i dag er vores primære fokus. Med stor kærlighed til racerne og et stærkt fagligt fundament arbejder vi målrettet for at fremavle sunde, velfungerende og racetypiske hunde med et godt og stabilt temperament.

Vores opdræt bygger på kvalitet, sundhed og et stærkt netværk af erfarne og ansvarlige opdrættere. Hver hvalp fra Kennel Speedex vokser op i trygge rammer og får den bedst mulige start på livet – både fysisk og mentalt.', 'text', 'home', 1),

-- Puppies page sections
('puppy_status', 'Ingen planlagte hvalpe', 'Der er ikke planlagt hvalpe på nuværende tidspunkt', 'card', 'puppies', 1),

('puppy_intro', 'Hvalpe hos Kennel Speedex', 'Hos Kennel Speedex er målet med hvert kuld at fremavle sunde, racetypiske og mentalt velfungerende terriere, som kan blive vigtige familiemedlemmer i mange år frem.

Terriere er kendt for deres livsglæde, mod og loyalitet. De knytter sig tæt til deres familie og deltager gerne i alt, hvad der sker – med stor energi og entusiasme. Derfor er det vigtigt med en tydelig, kærlig og konsekvent opdragelse, hvor hunden mærker trygge rammer og tydelig ledelse. Med respekt og kærlighed trives en terrier også godt sammen med børn.', 'text', 'puppies', 2),

('puppy_includes', 'Alle hvalpe fra Kennel Speedex:', 'Kan tidligst flytte hjemmefra ved 8 ugers alderen
Bliver udvalgt af os, med udgangspunkt i hvalpens temperament og den enkelte families ønsker og behov
Sælges med en DKK-købsaftale og har DKK-stambog
Er dyrlægekontrolleret, vaccineret, chippet, har fået ormekur
Medfølger EU-pas samt foder til den første tid i deres nye hjem', 'list', 'puppies', 3),

('puppy_contact_text', 'Kontakt for hvalpe', 'Hvis du ønsker at komme i betragtning til en hvalp fra os, så skriv gerne en mail til os med lidt information om dig/jer, jeres hverdag og jeres ønsker til en hund.', 'text', 'puppies', 4);

-- Enable RLS
ALTER TABLE content_sections ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access to content sections" ON content_sections
    FOR SELECT USING (is_active = true);

-- Allow authenticated users to manage content
CREATE POLICY "Allow authenticated users to manage content sections" ON content_sections
    FOR ALL USING (auth.role() = 'authenticated');

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_content_sections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_content_sections_updated_at
    BEFORE UPDATE ON content_sections
    FOR EACH ROW
    EXECUTE FUNCTION update_content_sections_updated_at();

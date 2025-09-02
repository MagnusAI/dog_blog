import Typography from '../components/ui/Typography';
import Button from '../components/ui/Button';

function PuppiesPage() {
    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-6xl mx-auto px-8 py-16">
                {/* Current Status Card */}
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 mb-12">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-400 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <div>
                            <Typography variant="h3" weight="semibold" className="text-gray-900 mb-1">
                                Ingen planlagte hvalpe
                            </Typography>
                            <Typography variant="body" color="secondary">
                                Der er ikke planlagt hvalpe på nuværende tidspunkt
                            </Typography>
                        </div>
                    </div>
                </div>

                {/* Header */}
                <Typography variant="h1" weight="bold" className="text-4xl md:text-5xl text-gray-900 mb-8">
                    Hvalpe hos Kennel Speedex
                </Typography>

                {/* Main Content */}
                <div className="space-y-8 mb-16">
                    <Typography variant="body" className="text-lg text-gray-600 leading-relaxed">
                        Hos Kennel Speedex er målet med hvert kuld at fremavle sunde, racetypiske og mentalt velfungerende terriere, som kan blive vigtige familiemedlemmer i mange år frem.
                    </Typography>

                    <Typography variant="body" className="text-lg text-gray-600 leading-relaxed">
                        Terriere er kendt for deres livsglæde, mod og loyalitet. De knytter sig tæt til deres familie og deltager gerne i alt, hvad der sker – med stor energi og entusiasme. Derfor er det vigtigt med en tydelig, kærlig og konsekvent opdragelse, hvor hunden mærker trygge rammer og tydelig ledelse. Med respekt og kærlighed trives en terrier også godt sammen med børn.
                    </Typography>
                </div>

                {/* What Comes With Puppies */}
                <div className="mb-16">
                    <Typography variant="h2" weight="bold" className="text-2xl md:text-3xl text-gray-900 mb-8">
                        Alle hvalpe fra Kennel Speedex:
                    </Typography>
                    <ul className="space-y-4 pl-4">
                        <li className="flex items-start gap-3">
                            <div className="w-2 h-2 bg-gray-400 rounded-full flex-shrink-0 mt-2"></div>
                            <Typography variant="body" className="text-gray-700">
                                Kan tidligst flytte hjemmefra ved 8 ugers alderen
                            </Typography>
                        </li>
                        <li className="flex items-start gap-3">
                            <div className="w-2 h-2 bg-gray-400 rounded-full flex-shrink-0 mt-2"></div>
                            <Typography variant="body" className="text-gray-700">
                                Bliver udvalgt af os, med udgangspunkt i hvalpens temperament og den enkelte families ønsker og behov
                            </Typography>
                        </li>
                        <li className="flex items-start gap-3">
                            <div className="w-2 h-2 bg-gray-400 rounded-full flex-shrink-0 mt-2"></div>
                            <Typography variant="body" className="text-gray-700">
                                Sælges med en DKK-købsaftale og har DKK-stambog
                            </Typography>
                        </li>
                        <li className="flex items-start gap-3">
                            <div className="w-2 h-2 bg-gray-400 rounded-full flex-shrink-0 mt-2"></div>
                            <Typography variant="body" className="text-gray-700">
                                Er dyrlægekontrolleret, vaccineret, chippet, har fået ormekur
                            </Typography>
                        </li>
                        <li className="flex items-start gap-3">
                            <div className="w-2 h-2 bg-gray-400 rounded-full flex-shrink-0 mt-2"></div>
                            <Typography variant="body" className="text-gray-700">
                                Medfølger EU-pas samt foder til den første tid i deres nye hjem
                            </Typography>
                        </li>
                    </ul>
                </div>

                {/* Interest Contact */}
                <div className="mb-16">
                    <Typography variant="body" className="text-lg text-gray-600 leading-relaxed mb-8">
                        Hvis du ønsker at komme i betragtning til en hvalp fra os, så skriv gerne en mail til os med lidt information om dig/jer, jeres hverdag og jeres ønsker til en hund.
                    </Typography>

                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
                        <Typography variant="body" className="text-lg text-gray-700">
                            E-mail:
                        </Typography>
                        <Button
                            variant="ghost"
                            onClick={() => window.location.href = 'mailto:tinearnild@hotmail.com'}
                            className="text-gray-900 border-gray-300 hover:bg-gray-100 px-6 py-3"
                        >
                            tinearnild@hotmail.com
                        </Button>
                    </div>
                </div>

            </div>
        </div>
    );
}

export default PuppiesPage;

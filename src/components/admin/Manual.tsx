import type { AdminViewServerProps } from 'payload'

import { DefaultTemplate } from '@payloadcms/next/templates'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import React from 'react'

/**
 * Manualul editorului — pagină proprie în admin (/admin/manual).
 * Payload dă view-urilor custom șablonul „minimal” (fără bara laterală), de aceea
 * ne învelim singuri în DefaultTemplate. Stilurile: .cc-dash (tokeni) + .cc-man (custom.scss).
 */

const SECTIUNI = [
  { id: 'intrare', titlu: 'Cum intri în panou' },
  { id: 'structura', titlu: 'Cum e organizat conținutul' },
  { id: 'unde-apare', titlu: 'Ce apare unde pe site' },
  { id: 'citat', titlu: 'Cum adaugi un citat' },
  { id: 'autor', titlu: 'Cum adaugi un autor' },
  { id: 'carte', titlu: 'Cum adaugi o carte' },
  { id: 'teme', titlu: 'Cum lucrezi cu temele' },
  { id: 'portret', titlu: 'Portretele autorilor' },
  { id: 'publicare', titlu: 'Când apar modificările pe site' },
  { id: 'calitate', titlu: 'Panoul de bord și calitatea conținutului' },
  { id: 'verificare', titlu: 'Lista de verificare' },
  { id: 'conturi', titlu: 'Conturi și ajutor' },
]

export function Manual({ initPageResult, params, searchParams }: AdminViewServerProps) {
  const { req } = initPageResult
  if (!req.user) {
    redirect(`${req.payload.config.routes.admin}/login`)
  }

  return (
    <DefaultTemplate
      i18n={req.i18n}
      locale={initPageResult.locale}
      params={params}
      payload={req.payload}
      permissions={initPageResult.permissions}
      searchParams={searchParams}
      user={req.user || undefined}
      visibleEntities={initPageResult.visibleEntities}
    >
      <div className="cc-dash cc-man">
        <header className="cc-dash__antet">
          <p className="cc-dash__eticheta">Citate creștine — panou de administrare</p>
          <h1 className="cc-dash__titlu">Manualul editorului</h1>
          <p className="cc-dash__subtitlu">
            Cum se adaugă și se întrețin citatele, autorii, cărțile, temele și portretele — și
            unde apare fiecare informație pe site.
          </p>
          <div className="cc-dash__filet" aria-hidden="true" />
        </header>

        <nav className="cc-man__cuprins" aria-label="Cuprins">
          <ol>
            {SECTIUNI.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`}>{s.titlu}</a>
              </li>
            ))}
          </ol>
        </nav>

        <article className="cc-man__continut">
          {/* ------------------------------------------------------------ */}
          <section id="intrare">
            <h2>1. Cum intri în panou</h2>
            <p>
              Panoul se deschide la adresa site-ului urmată de <code>/admin</code>. Intri cu adresa de
              e-mail și parola primite de la administrator. Dacă ai uitat parola, folosește linkul
              „Forgot password” de pe ecranul de autentificare; primești un e-mail de resetare.
            </p>
            <p>Meniul din stânga are două grupuri:</p>
            <ul>
              <li>
                <strong>Antologie</strong> — Citate, Autori, Cărți, Teme. Aici se face toată munca
                editorială.
              </li>
              <li>
                <strong>Administrare</strong> — Media (portretele autorilor) și Utilizatori
                (conturile de acces).
              </li>
            </ul>
            <p className="cc-man__nota">
              Contul tău are drepturi depline: tot ce salvezi apare pe site, iar ștergerile nu se pot
              anula din panou. Când nu ești sigur, lasă elementul neatins și întreabă.
            </p>
          </section>

          {/* ------------------------------------------------------------ */}
          <section id="structura">
            <h2>2. Cum e organizat conținutul</h2>
            <p>
              Totul pornește de la <strong>citat</strong>. Un citat are obligatoriu un{' '}
              <strong>autor</strong>, de obicei o <strong>carte</strong> (sursa) și una sau mai
              multe <strong>teme</strong>. Cartea aparține și ea unui autor, iar autorul poate avea
              un portret din <strong>Media</strong>.
            </p>
            <div className="cc-man__schema" role="img" aria-label="Citat → Autor, Carte, Teme">
              <div className="cc-man__schema-centru">Citat</div>
              <div className="cc-man__schema-ramuri">
                <div>
                  <span className="cc-man__schema-nod">Autor</span>
                  <small>obligatoriu · un singur autor</small>
                </div>
                <div>
                  <span className="cc-man__schema-nod">Carte</span>
                  <small>opțional · doar cărțile autorului ales</small>
                </div>
                <div>
                  <span className="cc-man__schema-nod">Teme</span>
                  <small>una sau mai multe</small>
                </div>
              </div>
              <div className="cc-man__schema-sub">
                Carte → Autor (un autor pe carte) · Autor → Imagine (din Media)
              </div>
            </div>
            <p>
              Ordinea firească de lucru: întâi te asiguri că <em>autorul</em> există, apoi{' '}
              <em>cartea</em> lui, apoi adaugi <em>citatele</em> și le dai teme. Dacă adaugi citatul
              primul, nu vei putea alege cartea până nu există.
            </p>
          </section>

          {/* ------------------------------------------------------------ */}
          <section id="unde-apare">
            <h2>3. Ce apare unde pe site</h2>
            <p>
              Fiecare câmp din panou are un loc precis pe site. Tabelul de mai jos îți spune ce
              vede cititorul pentru ce completezi.
            </p>
            <table className="cc-man__tabel">
              <thead>
                <tr>
                  <th>Câmp în panou</th>
                  <th>Unde apare pe site</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th colSpan={2}>Citat</th>
                </tr>
                <tr>
                  <td>Textul citatului</td>
                  <td>
                    Pagina citatului (titlul mare), listele pe autor / carte / temă, căutarea,
                    homepage-ul („Citatul zilei” și „Din antologie”), imaginea de distribuit.
                  </td>
                </tr>
                <tr>
                  <td>Slug</td>
                  <td>
                    Adresa paginii: <code>citatecrestine.ro/<em>slug</em></code>. Se generează
                    singur din primele cuvinte. Nu-l modifica după publicare — linkurile vechi s-ar
                    rupe.
                  </td>
                </tr>
                <tr>
                  <td>Autor</td>
                  <td>
                    Sub citat: „— Nume”, cu linkul spre pagina autorului, medalionul, anii și
                    descrierea scurtă.
                  </td>
                </tr>
                <tr>
                  <td>Carte (sursă)</td>
                  <td>
                    Sub autor: „din volumul <em>Titlu</em>, Editura, An”. Titlul duce la pagina
                    cărții la editură (dacă are URL extern), iar iconița de carte duce la pagina cu
                    toate citatele din volum.
                  </td>
                </tr>
                <tr>
                  <td>Teme</td>
                  <td>
                    Etichetele mici de sub sursă, breadcrumb-ul paginii, banda „Alte citate despre…”
                    (folosește prima temă) și paginile temelor.
                  </td>
                </tr>
                <tr>
                  <td>Pagină / referință</td>
                  <td>Se păstrează în bază, dar nu se afișează deocamdată.</td>
                </tr>

                <tr>
                  <th colSpan={2}>Autor</th>
                </tr>
                <tr>
                  <td>Nume</td>
                  <td>
                    Peste tot unde e atribuit un citat; titlul paginii autorului; în indexul
                    autorilor, inversat: „Spurgeon, Charles H.”.
                  </td>
                </tr>
                <tr>
                  <td>Ani</td>
                  <td>
                    Pe pagina citatului și pe pagina autorului („1834–1892 · …”) și în indexul
                    autorilor, lângă nume.
                  </td>
                </tr>
                <tr>
                  <td>Descriere scurtă</td>
                  <td>
                    Doar pe pagina citatului, pe un singur rând, după ani: „1834–1892 · predicator
                    baptist, Londra”.
                  </td>
                </tr>
                <tr>
                  <td>Descriere (pagina autorului)</td>
                  <td>Sub numele mare de pe pagina autorului, după ani.</td>
                </tr>
                <tr>
                  <td>Biografie</td>
                  <td>Se păstrează în bază, dar nu se afișează deocamdată.</td>
                </tr>
                <tr>
                  <td>Imagine (portret)</td>
                  <td>
                    Medalionul rotund de pe pagina citatului, pagina autorului și „Citatul zilei”.
                    Fără imagine, medalionul lipsește pur și simplu.
                  </td>
                </tr>
                <tr>
                  <td>Website</td>
                  <td>Nu se afișează; intră doar în datele pentru motoarele de căutare.</td>
                </tr>

                <tr>
                  <th colSpan={2}>Carte</th>
                </tr>
                <tr>
                  <td>Nume</td>
                  <td>
                    Titlul scurt, în atribuiri: „din volumul <em>Totul prin har</em>”, în listele de
                    citate și pe homepage.
                  </td>
                </tr>
                <tr>
                  <td>Nume complet</td>
                  <td>
                    Titlul cu subtitlu, pe pagina cărții și în banda „Sursele antologiei” de pe
                    pagina autorului și din <code>/carti</code>.
                  </td>
                </tr>
                <tr>
                  <td>Autor</td>
                  <td>Pagina cărții („de Autor”) și gruparea din lista surselor.</td>
                </tr>
                <tr>
                  <td>URL extern</td>
                  <td>
                    Linkul „vezi sursa →” de pe pagina cărții și ținta titlului de pe pagina
                    citatului.
                  </td>
                </tr>
                <tr>
                  <td>Editura, Anul</td>
                  <td>După titlu: „…, MAGNA GRATIA, 2020” — pe pagina citatului și a cărții.</td>
                </tr>
                <tr>
                  <td>Descriere</td>
                  <td>
                    Pe pagina cărții, sub autor și editură. Folosită pentru coautori: „Scrisă
                    împreună cu…” sau „Volum colectiv. Autori: …”.
                  </td>
                </tr>

                <tr>
                  <th colSpan={2}>Temă</th>
                </tr>
                <tr>
                  <td>Nume</td>
                  <td>
                    Indexul tematic, titlul paginii temei, etichetele de sub citate, banda
                    „Subiecte” de pe homepage (cele mai bogate 8 teme).
                  </td>
                </tr>
                <tr>
                  <td>Descriere</td>
                  <td>
                    Sub titlul paginii temei și ca descriere pentru motoarele de căutare.
                    Opțională.
                  </td>
                </tr>
              </tbody>
            </table>
            <p className="cc-man__nota">
              Indexul tematic și indexul autorilor arată doar temele și autorii care au cel puțin
              un citat. O temă nouă fără citate nu apare încă nicăieri.
            </p>
          </section>

          {/* ------------------------------------------------------------ */}
          <section id="citat">
            <h2>4. Cum adaugi un citat</h2>
            <ol>
              <li>
                <strong>Verifică dacă nu există deja.</strong> În lista Citate, caută câteva
                cuvinte din text. Căutarea ignoră diacriticele („sfintenia” găsește „sfințenia”).
              </li>
              <li>
                Apasă <strong>Adaugă citat</strong> (pe panoul de bord sau „Create new” în lista
                Citate).
              </li>
              <li>
                <strong>Textul citatului.</strong> Doar textul, fără ghilimele la început și la
                sfârșit, fără „— Autor” la final. Spațiile duble și rândurile noi se curăță singure.
              </li>
              <li>
                <strong>Autor.</strong> Alege din listă. Dacă lipsește, salvează întâi autorul
                (secțiunea 5), apoi revino.
              </li>
              <li>
                <strong>Carte.</strong> Lista arată doar cărțile autorului ales. Lasă gol doar dacă
                sursa chiar nu e cunoscută; panoul de bord numără citatele fără carte.
              </li>
              <li>
                <strong>Teme.</strong> Alege una sau două teme existente, cea mai specifică prima
                (prima temă dă breadcrumb-ul și „Alte citate despre…”). Nu crea o temă nouă pentru
                un singur citat.
              </li>
              <li>
                <strong>Salvează.</strong> Slug-ul se completează singur. Pagina citatului apare
                pe site în câteva secunde.
              </li>
            </ol>
            <h3>Reguli pentru text</h3>
            <ul>
              <li>
                Diacritice românești corecte: <strong>ș, ț</strong> cu virgulă dedesubt, nu ş, ţ cu
                sedilă. Ghilimelele din interior: „…”.
              </li>
              <li>Punct, semn de întrebare sau de exclamare la final. Fără „…” adăugat de noi.</li>
              <li>
                Un citat = o idee, de regulă 1–4 propoziții. Pasajele lungi se taie la o propoziție
                completă, nu la mijloc.
              </li>
              <li>
                Nu „corectăm” autorul: păstrăm formularea traducerii publicate. Se corectează doar
                greșelile evidente de tastare.
              </li>
              <li>
                Un citat identic cu altul nu se salvează a doua oară, nici dacă apare în altă carte
                (de exemplu într-o antologie).
              </li>
            </ul>
          </section>

          {/* ------------------------------------------------------------ */}
          <section id="autor">
            <h2>5. Cum adaugi un autor</h2>
            <ol>
              <li>
                <strong>Caută întâi</strong> în lista Autori, inclusiv variante ale numelui
                („J.C. Ryle” / „J. C. Ryle”). Un autor dublat împarte citatele pe două pagini.
              </li>
              <li>
                <strong>Nume.</strong> Forma în care apare pe coperțile MAGNA GRATIA, cu inițialele
                lipite de punct: „J.C. Ryle”, „R.C. Sproul”, „Charles H. Spurgeon”. Fără titluri
                („Dr.”, „Rev.”).
              </li>
              <li>
                <strong>Ani.</strong> Formatul „1834–1892”, cu linie lungă (–), nu cratimă (-).
                Pentru autori în viață lasă gol. Aproximativ: „c. 1620–1686”.
              </li>
              <li>
                <strong>Descriere scurtă.</strong> Cel mult 70 de caractere, cu literă mică la
                început, fără punct la final: „predicator baptist, Londra”. Apare pe pagina
                fiecărui citat, deci scurt și clar.
              </li>
              <li>
                <strong>Descriere.</strong> O propoziție completă despre autor, pentru pagina lui:
                „predicator și autor puritan englez, cunoscut pentru scrierile sale devoționale.”
              </li>
              <li>
                <strong>Imagine.</strong> Alege un portret existent din Media sau încarcă unul nou
                (secțiunea 8).
              </li>
              <li>
                <strong>Salvează.</strong> Slug-ul se generează din nume; pagina autorului este{' '}
                <code>/autori/<em>slug</em></code>.
              </li>
            </ol>
            <h3>Cărți cu mai mulți autori</h3>
            <p>
              Un citat are un singur autor: cel care a scris efectiv textul. La volumele colective
              (antologii), fiecare citat se pune pe autorul lui real, iar cartea poartă primul autor
              de pe copertă și îi listează pe ceilalți în câmpul <em>Descriere</em>. La cărțile
              scrise în doi („Deepak Reju, Jeremy Pierre”), citatele merg pe primul autor, iar al
              doilea este menționat în descrierea cărții.
            </p>
          </section>

          {/* ------------------------------------------------------------ */}
          <section id="carte">
            <h2>6. Cum adaugi o carte</h2>
            <ol>
              <li>
                <strong>Nume.</strong> Titlul scurt, înainte de punct: „Convertit”. Apare în
                atribuiri, unde spațiul e mic.
              </li>
              <li>
                <strong>Nume complet.</strong> Titlul cu subtitlu, exact ca pe copertă: „Convertit.
                De la Adam la Hristos”. Dacă nu are subtitlu, lasă gol.
              </li>
              <li>
                <strong>Autor.</strong> Autorul de pe copertă (primul, la volumele cu mai mulți).
              </li>
              <li>
                <strong>URL extern.</strong> Pagina cărții la editură, de exemplu{' '}
                <code>https://www.magnagratia.org/carti/174-totulprinhar-spurgeon/</code>. Pentru
                surse din afara editurii, pagina sursei (de exemplu spurgeongems.org).
              </li>
              <li>
                <strong>Editura</strong> („MAGNA GRATIA”) și <strong>Anul</strong> apariției, dacă
                se știu.
              </li>
              <li>
                <strong>Descriere.</strong> Doar pentru coautori sau o notă scurtă despre volum.
              </li>
            </ol>
            <p className="cc-man__nota">
              O carte fără citate apare în lista surselor, dar pagina ei va fi goală. Adaugă cartea
              când ai și primele citate din ea.
            </p>
          </section>

          {/* ------------------------------------------------------------ */}
          <section id="teme">
            <h2>7. Cum lucrezi cu temele</h2>
            <ul>
              <li>
                <strong>Folosește temele existente.</strong> Antologia are peste 600 de teme; aproape
                sigur există deja una potrivită. Caută după cuvânt-cheie înainte de a crea.
              </li>
              <li>
                <strong>Denumire</strong> cu prima literă mare, restul mic: „Rugăciunea”, „Frica de
                Dumnezeu”. Substantiv articulat, la singular, ca o rubrică de index.
              </li>
              <li>
                <strong>Sinonime</strong> într-o singură temă, despărțite cu bară: „Păcatul/
                păcătoșenia”, „Fățărnicia/ipocrizia”. Nu crea două teme pentru același lucru.
              </li>
              <li>
                <strong>Descriere</strong> (opțională): o frază care apare sub titlul temei și în
                rezultatele Google. Merită la temele mari.
              </li>
              <li>
                <strong>Ștergerea</strong> unei teme scoate eticheta de pe toate citatele ei. Mai
                bine mută întâi citatele pe tema corectă, apoi șterge.
              </li>
            </ul>
          </section>

          {/* ------------------------------------------------------------ */}
          <section id="portret">
            <h2>8. Portretele autorilor</h2>
            <p>
              Portretul apare într-un medalion rotund, de cel mult 168 de pixeli pe ecran. Imaginea
              trebuie pregătită înainte de încărcare, ca site-ul să rămână rapid.
            </p>
            <table className="cc-man__tabel cc-man__tabel--compact">
              <tbody>
                <tr>
                  <td>Format</td>
                  <td>JPEG (.jpg)</td>
                </tr>
                <tr>
                  <td>Dimensiune</td>
                  <td>pătrat, 480 × 480 pixeli</td>
                </tr>
                <tr>
                  <td>Mărime fișier</td>
                  <td>sub 50 KB (de regulă 15–35 KB)</td>
                </tr>
                <tr>
                  <td>Decupaj</td>
                  <td>fața centrată, puțin aer deasupra capului; fără text, rame sau fundaluri încărcate</td>
                </tr>
                <tr>
                  <td>Culoare</td>
                  <td>oricare — site-ul afișează medalioanele în alb-negru cald, uniform</td>
                </tr>
              </tbody>
            </table>
            <ol>
              <li>
                Pregătește imaginea la 480 × 480 (orice editor de imagini; „Export for web”,
                calitate 80–85).
              </li>
              <li>
                În <strong>Media</strong>, apasă „Create new”, încarcă fișierul și completează{' '}
                <strong>Text alternativ</strong> cu numele autorului. Salvează.
              </li>
              <li>
                Deschide autorul, alege imaginea la <strong>Imagine (portret)</strong>, salvează.
              </li>
              <li>
                Dacă înlocuiești un portret, șterge vechiul fișier din Media după ce ai legat
                noul, ca să nu rămână fișiere orfane.
              </li>
            </ol>
            <p className="cc-man__nota">
              Drepturi: portretele istorice (gravuri, fotografii vechi) sunt libere. Pentru autori
              contemporani folosește poze primite de la editură sau de la autor; nu lua imagini de
              pe site-uri fără permisiune.
            </p>
          </section>

          {/* ------------------------------------------------------------ */}
          <section id="publicare">
            <h2>9. Când apar modificările pe site</h2>
            <ul>
              <li>
                <strong>Imediat</strong> după salvare, pentru orice citat, autor, carte sau temă
                modificat din panou. Site-ul își reface singur paginile.
              </li>
              <li>
                <strong>Homepage-ul</strong> se regenerează la cel mult 10 minute. „Din antologie”
                arată ultimele 5 citate adăugate, deci un citat nou apare acolo repede.
              </li>
              <li>
                <strong>Citatul zilei</strong> se alege automat, același pentru toți vizitatorii în
                ziua respectivă, dintre citatele existente la miezul nopții. Un citat adăugat azi
                poate deveni „citatul zilei” abia de mâine.
              </li>
              <li>
                Dacă o pagină pare veche, reîncarc-o fără cache (Ctrl+F5). Dacă tot nu s-a
                actualizat după câteva minute, anunță administratorul.
              </li>
            </ul>
          </section>

          {/* ------------------------------------------------------------ */}
          <section id="calitate">
            <h2>10. Panoul de bord și calitatea conținutului</h2>
            <p>
              Panoul de bord (pagina de după autentificare) arată numărul de citate, autori, cărți
              și teme, ultimele citate modificate și trei semnale de calitate. Fiecare semnal este un
              link către lista filtrată, ca să le rezolvi pe rând.
            </p>
            <table className="cc-man__tabel">
              <thead>
                <tr>
                  <th>Semnal</th>
                  <th>Ce înseamnă</th>
                  <th>Ce faci</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>citate fără carte (sursă)</td>
                  <td>Citatul nu spune din ce volum provine.</td>
                  <td>Deschide citatul și alege cartea; dacă lipsește, creează cartea întâi.</td>
                </tr>
                <tr>
                  <td>citate fără teme</td>
                  <td>Citatul nu apare în niciun subiect din index.</td>
                  <td>Adaugă una sau două teme existente.</td>
                </tr>
                <tr>
                  <td>autori fără imagine</td>
                  <td>Pagina autorului și citatele lui apar fără medalion.</td>
                  <td>Încarcă un portret conform secțiunii 8, când există unul potrivit.</td>
                </tr>
              </tbody>
            </table>
            <p>
              Semnul ✓ înseamnă că nu mai e nimic de rezolvat la acel punct. Numerele nu sunt
              urgențe, ci lista de lucru pentru zilele liniștite.
            </p>
          </section>

          {/* ------------------------------------------------------------ */}
          <section id="verificare">
            <h2>11. Lista de verificare înainte de salvare</h2>
            <ul className="cc-man__checklist">
              <li>Citatul nu există deja (căutare în listă).</li>
              <li>Text fără ghilimele exterioare, cu diacritice corecte și punct final.</li>
              <li>Autorul corect, cu numele în forma standard a antologiei.</li>
              <li>Cartea aleasă din lista autorului; nume scurt și nume complet corecte.</li>
              <li>Una sau două teme existente, cea mai specifică prima.</li>
              <li>La autor nou: ani cu linie lungă, descriere scurtă sub 70 de caractere.</li>
              <li>La portret nou: 480 × 480, JPEG, sub 50 KB, text alternativ = numele.</li>
              <li>Slug-ul nu a fost modificat la un element deja publicat.</li>
            </ul>
            <h3>Greșeli frecvente</h3>
            <ul>
              <li>Autor creat a doua oară cu o variantă de nume → citatele se împart pe două pagini.</li>
              <li>Temă nouă pentru un singur citat → indexul tematic se umple de rubrici goale.</li>
              <li>Cratimă în loc de linie lungă la ani („1834-1892”) → aspect inconsecvent.</li>
              <li>Poză mare, de câțiva MB, încărcată direct → pagina se deschide greu.</li>
              <li>Slug schimbat după publicare → linkul distribuit de cititori nu mai merge.</li>
            </ul>
          </section>

          {/* ------------------------------------------------------------ */}
          <section id="conturi">
            <h2>12. Conturi și ajutor</h2>
            <ul>
              <li>
                <strong>Un cont nou</strong> se face din Administrare → Utilizatori → „Create new”:
                nume, e-mail, parolă. Toți utilizatorii au aceleași drepturi, deci dă acces doar
                persoanelor care editează efectiv.
              </li>
              <li>
                <strong>Parola proprie</strong> se schimbă din iconița de cont (dreapta sus) →
                Account. Tot acolo poți alege tema deschisă sau întunecată a panoului.
              </li>
              <li>
                <strong>Probleme tehnice</strong> (pagină care nu se actualizează, eroare la
                salvare, imagine care nu se încarcă): notează ce ai făcut, ora și mesajul primit și
                trimite-le administratorului.
              </li>
            </ul>
            <p className="cc-man__final">
              <Link href="/admin">← Înapoi la panoul de bord</Link>
            </p>
          </section>
        </article>
      </div>
    </DefaultTemplate>
  )
}

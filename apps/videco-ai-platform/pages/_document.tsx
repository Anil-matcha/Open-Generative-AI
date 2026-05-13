import { Html, Head, Main, NextScript } from "next/document";
import Script from "next/script";

export default function Document() {
    return (
        <Html>
            <Head>
                {" "}
                <Script
                    id="partnero-universal"
                    strategy="afterInteractive" // This ensures the script runs after page load
                    dangerouslySetInnerHTML={{
                        __html: `
            (function(p,t,n,e,r,o){ 
              p['__partnerObject']=r;
              function f(){
                var c={ a:arguments,q:[]};
                var r=this.push(c);
                return "number"!=typeof r?r:f.bind(c.q);
              }
              f.q=f.q||[];
              p[r]=p[r]||f.bind(f.q);
              p[r].q=p[r].q||f.q;
              o=t.createElement(n);
              var _=t.getElementsByTagName(n)[0];
              o.async=1;
              o.src=e+'?v'+(~~(new Date().getTime()/1e6));
              _.parentNode.insertBefore(o,_);
            })(window, document, 'script', 'https://app.partnero.com/js/universal.js', 'po');
            
            po('settings', 'assets_host', 'https://assets.partnero.com');
            po('program', 'XWWZZGQN', 'load');
          `,
                    }}
                />
            </Head>
            <body>
                <Main />
                <NextScript />
            </body>
        </Html>
    );
}

/** Original vector landmarks: lightweight scenery, no borrowed game characters. */
export function JourneyLandmark({ world }: { world: number }) {
  const id = `quadro-land-${world}`;
  return <svg viewBox="0 0 200 220" width="100%" height="100%" aria-hidden="true">
    <defs><linearGradient id={id} x1="0" y1="0" x2="1" y2="1"><stop stopColor={world > 3 ? "#d7bee2" : "#d8dfa9"}/><stop offset="1" stopColor={world > 3 ? "#9d88ba" : "#81a387"}/></linearGradient></defs>
    <ellipse cx="100" cy="198" rx="59" ry="9" fill="#1b3a4a" opacity=".12"/>
    <path d="M17 144 66 184 101 198 148 178 185 143Z" fill={world > 3 ? "#75688c" : "#607f72"}/>
    <path d="m17 144 49 40 15-30Z" fill="#d8d6bc" opacity=".4"/><path d="m101 156 0 42 47-20 37-35Z" fill="#213e53" opacity=".23"/>
    <ellipse cx="100" cy="142" rx="85" ry="29" fill={`url(#${id})`} stroke="#fff2ce" strokeOpacity=".5" strokeWidth="2"/>
    <path d="M39 149q65 22 123-7" fill="none" stroke="#f5e5ae" strokeWidth="3" opacity=".6"/>
    {world <= 1 && <>
      {[{x:62,y:98,s:1},{x:127,y:106,s:.8},{x:100,y:75,s:1.15}].map(({x,y,s})=><g key={x} transform={`translate(${x} ${y}) scale(${s})`}>
        <path d="M0 18v33" stroke="#685c43" strokeWidth="7"/>
        {world ? <><path d="m0-35-24 38h12l-18 23h59L12 3h12Z" fill="#3f7162"/><path d="M0-35v61h29L12 3h12Z" fill="#254f48" opacity=".35"/></> : <><circle cy="-10" r="24" fill="#618e69"/><circle cx="-17" cy="7" r="20" fill="#7fa477"/><circle cx="15" cy="8" r="22" fill="#426f56"/><circle cx="-8" cy="-18" r="9" fill="#b5cc91" opacity=".5"/></>}
      </g>)}
      <path d="M40 137q35-18 61 1t60-3" stroke="#ecd99b" strokeWidth="5" fill="none"/>
      <g fill="#f7df8d"><circle cx="45" cy="149" r="3"/><circle cx="122" cy="147" r="2"/><circle cx="152" cy="132" r="3"/></g>
    </>}
    {world === 2 && <>
      <path d="m78 139 8-77h30l9 77Z" fill="#f3dfb2"/><path d="m101 62 1 77h23l-9-77Z" fill="#c4b088"/>
      <path d="M84 81h34l2 13H82Z" fill="#b9705a"/><path d="M80 111h42l1 13H79Z" fill="#b9705a"/>
      <path d="M83 61V45h36v16Z" fill="#527f82" stroke="#eedfb3" strokeWidth="3"/><path d="m77 44 24-19 24 19Z" fill="#4a665d"/>
      <path d="M100 48v10" stroke="#f4e9bd" strokeWidth="4"/><path d="m86 48-53-15v39l53-14m33-10 52-15v39l-52-14" fill="#fff1b6" opacity=".16"/>
      <path d="M41 154q17-8 34 0t33 0t36 0" stroke="#e2e9c3" strokeWidth="3" fill="none"/>
    </>}
    {world === 3 && <>
      <path d="m31 139 35-89 40 90Z" fill="#abb7a6"/><path d="m66 50 40 90H71Z" fill="#7a958e"/><path d="m53 82 13-32 15 33-16-9Z" fill="#efeada"/>
      <path d="m105 141 31-105 42 108Z" fill="#849f9a"/><path d="m136 36 42 108h-40Z" fill="#5b7f7c"/><path d="m125 73 11-37 16 39-17-12Z" fill="#f1eada"/>
      <path d="M65 139v-28q35-35 70 0v28" fill="#dfcc9d"/><path d="M80 141v-26q20-20 40 0v26" fill="#718d88"/><path d="M61 108q39-35 78 0" stroke="#fcf0c7" strokeWidth="4" fill="none"/>
    </>}
    {world === 4 && <g stroke="#fff1d6" strokeWidth="1.5">
      <path d="m80 142-12-66 31-39 24 38-9 69Z" fill="#b2a3d5"/><path d="m99 37-3 102 27-64Z" fill="#e2d3f1"/><path d="m80 142 16-3-28-63Z" fill="#776eaa"/>
      <path d="m123 145-1-38 24-28 17 31-17 39Z" fill="#83bdc4"/><path d="m146 79-8 65 25-34Z" fill="#b3e0d7"/>
      <path d="m41 140-1-35 21-28 18 37-13 32Z" fill="#d6b9ba"/><path d="m61 77 5 69 13-32Z" fill="#f1d5b5"/>
      <path d="m142 42 3 10 10 3-10 3-3 10-3-10-10-3 10-3Z" fill="#fff0bc" stroke="none"/>
    </g>}
    {world === 5 && <>
      <ellipse cx="100" cy="141" rx="41" ry="11" fill="#8c6e9b" opacity=".5"/>
      <path d="m63 83 13 48h51l13-48-26 19-13-35-14 35Z" fill="#edcd79" stroke="#fff0ba" strokeWidth="2"/>
      <path d="m101 67 13 35 26-19-13 48h-26Z" fill="#c6974d" opacity=".5"/>
      <path d="M77 126h48v12H77Z" fill="#f1d593"/><path d="m100 99 8 11-8 11-8-11Z" fill="#6d8c83"/>
      <g fill="#fff0b3"><circle cx="63" cy="81" r="5"/><circle cx="101" cy="65" r="5"/><circle cx="140" cy="81" r="5"/><path d="m50 48 4 12 12 4-12 4-4 12-4-12-12-4 12-4Z"/><path d="m145 29 3 8 8 3-8 3-3 8-3-8-8-3 8-3Z"/></g>
    </>}
  </svg>;
}

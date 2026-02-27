import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  subscribeCars, addCar, updateCar, deleteCar,
  subscribeInquiries, addInquiry as fbAddInquiry, updateInquiry, deleteInquiry
} from './firebase.js';
import { compressImage } from './imageUtil.js';

/* ═══════════════════════════════════════════
   CARON – 신차 장기렌트 & 리스 승계 전문
   Firebase Firestore + Vercel
   ═══════════════════════════════════════════ */

const ADMIN_PW = 'caron2580';
const TEL = '1800-7220';
const BRANDS = ['전체','현대','기아','제네시스','BMW','벤츠','아우디','테슬라','볼보','쉐보레','쌍용','르노','미니','포르쉐','랜드로버','폭스바겐','지프','포드','렉서스','링컨','마세라티','폴스타','토요타','혼다','기타'];
const FUELS = ['전체','가솔린','디젤','하이브리드','전기','LPG'];

// ── Colors ──
const G = '#F5D000', GD = '#D4B300', BK = '#0D0D0D', DB = '#111',
  CD = '#1A1A1A', BD = '#2A2A2A', TX = '#E8E8E8', MT = '#888',
  RD = '#E53935', GR = '#4CAF50', BL = '#64B5F6';

// ── Helpers ──
const fmt = n => n?.toLocaleString?.() ?? '0';
const fmtW = n => { if(!n)return'0'; return n>=10000?(n/10000).toFixed(0)+'만':fmt(n); };

// ── SVG Icons (minimal) ──
const ic = {
  crown: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 4l3 12h14l3-12-5 4-5-6-5 6z"/><path d="M3 16h18v2a2 2 0 01-2 2H5a2 2 0 01-2-2v-2z"/></svg>,
  search: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>,
  car: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 16H9m10 0h3v-3.15a1 1 0 00-.84-.99L16 11l-2.7-3.6a1 1 0 00-.8-.4H5.24a1 1 0 00-.9.55l-2.2 4.4A1 1 0 002 12.13V16h3"/><circle cx="6.5" cy="16.5" r="2.5"/><circle cx="16.5" cy="16.5" r="2.5"/></svg>,
  phone: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>,
  eye: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  plus: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>,
  edit: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  trash: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>,
  x: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>,
  back: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>,
  pin: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  fuel: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 22V5a2 2 0 012-2h8a2 2 0 012 2v17"/><path d="M15 10h2a2 2 0 012 2v2a2 2 0 002 2 2 2 0 002-2V8l-3-3"/><rect x="6" y="7" width="6" height="5"/></svg>,
  shield: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  settings: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
  img: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
  filter: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>,
  home: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  lock: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>,
  check: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>,
  user: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  chevL: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>,
  chevR: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>,
  upload: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/></svg>,
  checkCircle: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  inbox: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z"/></svg>,
  loading: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>,
};

// ── Global CSS ──
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;600;700;900&family=Playfair+Display:wght@700;800;900&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
html{font-size:16px}
body{background:${BK};color:${TX};font-family:'Noto Sans KR',sans-serif;-webkit-font-smoothing:antialiased;overflow-x:hidden}
::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:${BK}}::-webkit-scrollbar-thumb{background:#333;border-radius:3px}
input,select,textarea{font-family:'Noto Sans KR',sans-serif;background:${DB};border:1px solid ${BD};color:${TX};padding:10px 14px;border-radius:8px;font-size:14px;outline:none;transition:border-color .2s;width:100%}
input:focus,select:focus,textarea:focus{border-color:${G}}
select{cursor:pointer;-webkit-appearance:none;appearance:none;background-image:url("data:image/svg+xml,%3Csvg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 12px center;padding-right:36px}
textarea{resize:vertical;min-height:80px}
.badge{display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;letter-spacing:.3px;white-space:nowrap}
.b-rent{background:rgba(245,208,0,.12);color:${G};border:1px solid rgba(245,208,0,.25)}
.b-lease{background:rgba(100,181,246,.12);color:${BL};border:1px solid rgba(100,181,246,.25)}
.b-prem{background:rgba(245,208,0,.18);color:${G};border:1px solid ${G}}
.b-done{background:rgba(229,57,53,.12);color:${RD};border:1px solid rgba(229,57,53,.3)}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:7px;padding:10px 20px;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;border:none;transition:all .15s;font-family:'Noto Sans KR',sans-serif;white-space:nowrap}
.bp{background:${G};color:${BK}}.bp:hover{background:${GD}}
.bo{background:transparent;color:${G};border:1px solid ${G}}.bo:hover{background:rgba(245,208,0,.08)}
.bd{background:${RD};color:#fff}.bd:hover{background:#C62828}
.bg{background:transparent;color:${MT};border:none}.bg:hover{color:${TX};background:rgba(255,255,255,.04)}
.bs{padding:6px 14px;font-size:13px}
@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
@keyframes spin{to{transform:rotate(360deg)}}
.anim{animation:fadeIn .3s ease-out forwards}
.hover-c{transition:all .2s ease}.hover-c:hover{transform:translateY(-3px);box-shadow:0 8px 30px rgba(0,0,0,.4)}
.spin{animation:spin 1s linear infinite}
.tab{padding:10px 18px;font-size:14px;font-weight:600;cursor:pointer;border:none;background:transparent;color:${MT};border-bottom:2px solid transparent;transition:all .15s}
.tab:hover{color:${TX}}.tab.active{color:${G};border-bottom-color:${G}}
@media(max-width:640px){
  .hide-m{display:none!important}
  .grid-m1{grid-template-columns:1fr!important}
}
`;

// ── Stable Input (no cursor jump) ──
// Uses defaultValue + onBlur to avoid re-render cursor issues
// key prop forces remount only when form resets
function CI({value,onChange,onKeyDown,...p}){
  const ref=useRef(null);
  // Sync ref on mount / external value change when not focused
  useEffect(()=>{
    if(ref.current && ref.current !== document.activeElement){
      ref.current.value = value ?? '';
    }
  },[value]);
  return <input
    ref={ref}
    defaultValue={value??''}
    onChange={e=>{
      if(onChange) onChange(e);
    }}
    onKeyDown={onKeyDown}
    {...p}
  />
}
function CT({value,onChange,...p}){
  const ref=useRef(null);
  useEffect(()=>{
    if(ref.current && ref.current !== document.activeElement){
      ref.current.value = value ?? '';
    }
  },[value]);
  return <textarea
    ref={ref}
    defaultValue={value??''}
    onChange={e=>{
      if(onChange) onChange(e);
    }}
    {...p}
  />
}

// ── Lightbox (fullscreen image viewer) ──
function Lightbox({images,startIdx,onClose}){
  const [i,setI]=useState(startIdx||0);
  const [zoom,setZoom]=useState(false);
  useEffect(()=>{
    const handler=e=>{
      if(e.key==='Escape')onClose();
      if(e.key==='ArrowLeft')setI(p=>(p-1+images.length)%images.length);
      if(e.key==='ArrowRight')setI(p=>(p+1)%images.length);
    };
    window.addEventListener('keydown',handler);
    return()=>window.removeEventListener('keydown',handler);
  },[images.length]);

  return(
    <div onClick={onClose} style={{position:'fixed',inset:0,zIndex:999,background:'rgba(0,0,0,.95)',display:'flex',alignItems:'center',justifyContent:'center',padding:10,cursor:'zoom-out'}}>
      <button onClick={e=>{e.stopPropagation();onClose()}} style={{position:'absolute',top:16,right:16,background:'rgba(255,255,255,.15)',border:'none',color:'#fff',width:40,height:40,borderRadius:'50%',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,zIndex:1001}}>✕</button>
      <div style={{position:'absolute',top:16,left:'50%',transform:'translateX(-50%)',color:'#fff',fontSize:13,background:'rgba(0,0,0,.5)',padding:'4px 12px',borderRadius:12,zIndex:1001}}>{i+1} / {images.length}</div>
      <img
        src={images[i]}
        alt=""
        onClick={e=>{e.stopPropagation();setZoom(!zoom)}}
        style={{maxWidth:zoom?'none':'90vw',maxHeight:zoom?'none':'90vh',objectFit:'contain',cursor:zoom?'zoom-out':'zoom-in',transition:'transform .2s',transform:zoom?'scale(1.5)':'scale(1)'}}
      />
      {images.length>1&&<>
        <button onClick={e=>{e.stopPropagation();setI(p=>(p-1+images.length)%images.length)}} style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',background:'rgba(255,255,255,.15)',border:'none',color:'#fff',width:44,height:44,borderRadius:'50%',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1001}}>{ic.chevL}</button>
        <button onClick={e=>{e.stopPropagation();setI(p=>(p+1)%images.length)}} style={{position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',background:'rgba(255,255,255,.15)',border:'none',color:'#fff',width:44,height:44,borderRadius:'50%',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1001}}>{ic.chevR}</button>
      </>}
    </div>
  );
}

// ── Image Gallery ──
function Gallery({images,h=200,onImageClick}){
  const [i,setI]=useState(0);
  const imgs=images||[];
  if(!imgs.length) return <div style={{height:h,background:'linear-gradient(135deg,#1e1e1e,#2a2a2a)',display:'flex',alignItems:'center',justifyContent:'center'}}><div style={{textAlign:'center',color:'#444'}}>{ic.img}<p style={{fontSize:11,marginTop:4}}>사진 없음</p></div></div>;
  return(
    <div style={{position:'relative',height:h,background:'#111',overflow:'hidden'}}>
      <img src={imgs[i]} alt="" onClick={e=>{e.stopPropagation();if(onImageClick)onImageClick(i)}} style={{width:'100%',height:'100%',objectFit:'cover',transition:'opacity .3s',cursor:onImageClick?'zoom-in':'default'}}/>
      {imgs.length>1&&<>
        <button onClick={e=>{e.stopPropagation();setI(p=>(p-1+imgs.length)%imgs.length)}} style={{position:'absolute',left:6,top:'50%',transform:'translateY(-50%)',background:'rgba(0,0,0,.5)',border:'none',color:'#fff',width:30,height:30,borderRadius:'50%',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>{ic.chevL}</button>
        <button onClick={e=>{e.stopPropagation();setI(p=>(p+1)%imgs.length)}} style={{position:'absolute',right:6,top:'50%',transform:'translateY(-50%)',background:'rgba(0,0,0,.5)',border:'none',color:'#fff',width:30,height:30,borderRadius:'50%',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>{ic.chevR}</button>
        <div style={{position:'absolute',bottom:8,left:'50%',transform:'translateX(-50%)',display:'flex',gap:4}}>
          {imgs.map((_,j)=><div key={j} onClick={e=>{e.stopPropagation();setI(j)}} style={{width:6,height:6,borderRadius:'50%',background:j===i?'#fff':'rgba(255,255,255,.4)',cursor:'pointer'}}/>)}
        </div>
        <div style={{position:'absolute',top:8,right:8,background:'rgba(0,0,0,.6)',color:'#fff',padding:'2px 7px',borderRadius:8,fontSize:10}}>{i+1}/{imgs.length}</div>
      </>}
    </div>
  );
}

// ── Image Uploader (max 20, compress) ──
function ImgUploader({images,setImages}){
  const ref=useRef(null);
  const MAX=20;
  const [compressing,setCompressing]=useState(false);

  const handle=async(e)=>{
    const files=Array.from(e.target.files);
    const remain=MAX-images.length;
    if(remain<=0){alert('최대 20장까지 업로드 가능합니다.');return}
    const toAdd=files.slice(0,remain);
    setCompressing(true);
    try{
      const results=[];
      for(const f of toAdd){
        const b64=await compressImage(f);
        results.push(b64);
      }
      setImages(prev=>[...prev,...results]);
    }catch(err){console.error(err);alert('이미지 처리 중 오류가 발생했습니다.')}
    setCompressing(false);
    e.target.value='';
  };

  const rm=(i)=>setImages(prev=>prev.filter((_,idx)=>idx!==i));

  return(
    <div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
        <span style={{fontSize:12,fontWeight:600,color:MT}}>차량 사진 ({images.length}/{MAX})</span>
        {images.length<MAX&&<button className="btn bo bs" onClick={()=>ref.current?.click()} disabled={compressing}>
          {compressing?<span className="spin">{ic.loading}</span>:ic.upload} {compressing?'압축중...':'사진 추가'}
        </button>}
      </div>
      <input ref={ref} type="file" accept="image/*" multiple onChange={handle} style={{display:'none'}}/>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(80px,1fr))',gap:6}}>
        {images.map((src,i)=>(
          <div key={i} style={{position:'relative',aspectRatio:'1',borderRadius:6,overflow:'hidden',border:`1px solid ${BD}`}}>
            <img src={src} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
            <button onClick={()=>rm(i)} style={{position:'absolute',top:2,right:2,background:'rgba(0,0,0,.7)',border:'none',color:'#fff',width:18,height:18,borderRadius:'50%',cursor:'pointer',fontSize:11,display:'flex',alignItems:'center',justifyContent:'center'}}>×</button>
            {i===0&&<div style={{position:'absolute',bottom:0,left:0,right:0,background:'rgba(245,208,0,.85)',color:BK,fontSize:8,fontWeight:700,textAlign:'center',padding:'1px 0'}}>대표</div>}
          </div>
        ))}
        {images.length<MAX&&!compressing&&(
          <div onClick={()=>ref.current?.click()} style={{aspectRatio:'1',borderRadius:6,border:`2px dashed ${BD}`,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',cursor:'pointer',color:MT,fontSize:10,gap:2}}>{ic.plus} 추가</div>
        )}
      </div>
    </div>
  );
}

// ── Header ──
function Header({page,setPage,isAdmin,setIsAdmin}){
  const [show,setShow]=useState(false);
  const [pw,setPw]=useState('');
  const login=()=>{if(pw===ADMIN_PW){setIsAdmin(true);setShow(false);setPage('admin');setPw('')}else alert('비밀번호가 일치하지 않습니다.')};

  return(<>
    <header style={{position:'sticky',top:0,zIndex:100,background:'rgba(13,13,13,.92)',backdropFilter:'blur(20px)',WebkitBackdropFilter:'blur(20px)',borderBottom:`1px solid ${BD}`}}>
      <div style={{maxWidth:1280,margin:'0 auto',padding:'0 16px',display:'flex',alignItems:'center',justifyContent:'space-between',height:56}}>
        <div style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer'}} onClick={()=>{setPage('home');setIsAdmin(false)}}>
          <span style={{fontFamily:"'Playfair Display',serif",fontSize:20,fontWeight:800,color:G,letterSpacing:2}}>CARON</span>
          <span className="hide-m" style={{fontSize:9,color:MT,letterSpacing:1}}>신차 장기렌트 & 리스</span>
        </div>
        <nav style={{display:'flex',alignItems:'center',gap:2}}>
          <button className="btn bg bs" onClick={()=>{setPage('home');setIsAdmin(false)}}>{ic.home}<span className="hide-m">승계차량</span></button>
          {isAdmin?<>
            <button className="btn bg bs" onClick={()=>setPage('admin')}>{ic.settings}<span className="hide-m">관리</span></button>
            <button className="btn bg bs" onClick={()=>{setIsAdmin(false);setPage('home')}} style={{fontSize:12}}>로그아웃</button>
          </>:<button className="btn bg bs" onClick={()=>setShow(true)}>{ic.lock}<span className="hide-m">관리자</span></button>}
        </nav>
      </div>
    </header>
    {show&&<div style={{position:'fixed',inset:0,zIndex:200,background:'rgba(0,0,0,.7)',display:'flex',alignItems:'center',justifyContent:'center',padding:16}} onClick={()=>setShow(false)}>
      <div style={{background:CD,borderRadius:14,padding:24,width:'100%',maxWidth:340,border:`1px solid ${BD}`}} onClick={e=>e.stopPropagation()}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18}}>
          <h3 style={{fontSize:16,fontWeight:700}}>관리자 로그인</h3>
          <button style={{background:'none',border:'none',color:MT,cursor:'pointer'}} onClick={()=>setShow(false)}>{ic.x}</button>
        </div>
        <CI type="password" value={pw} onChange={e=>setPw(e.target.value)} placeholder="비밀번호" onKeyDown={e=>{if(e.key==='Enter')login()}}/>
        <button className="btn bp" style={{width:'100%',marginTop:12}} onClick={login}>로그인</button>
      </div>
    </div>}
  </>);
}

// ── Car Card ──
function CarCard({car,onClick}){
  const done=car.status==='completed';
  return(
    <div className="hover-c anim" onClick={onClick} style={{background:CD,borderRadius:12,overflow:'hidden',cursor:'pointer',border:`1px solid ${done?'rgba(229,57,53,.25)':BD}`,position:'relative',opacity:done?.82:1}}>
      <div style={{position:'relative'}}>
        <Gallery images={car.images||[]}/>
        {done&&<div style={{position:'absolute',inset:0,background:'rgba(0,0,0,.6)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:5,pointerEvents:'none'}}>
          <div style={{background:'rgba(229,57,53,.9)',color:'#fff',padding:'8px 22px',borderRadius:8,fontWeight:800,fontSize:15,letterSpacing:1,transform:'rotate(-5deg)',border:'2px solid rgba(255,255,255,.3)'}}>승계완료</div>
        </div>}
        <div style={{position:'absolute',top:8,left:8,display:'flex',gap:4,zIndex:6}}>
          <span className={`badge ${car.contractType==='렌트'?'b-rent':'b-lease'}`}>{car.contractType}</span>
          {car.isPremium&&<span className="badge b-prem">★ 프리미엄</span>}
          {done&&<span className="badge b-done">승계완료</span>}
        </div>
        {car.supportAmount>0&&!done&&<div style={{position:'absolute',bottom:8,right:8,background:'rgba(245,208,0,.9)',color:BK,padding:'3px 9px',borderRadius:14,fontSize:10,fontWeight:700,zIndex:6}}>지원금 {fmtW(car.supportAmount)}원</div>}
      </div>
      <div style={{padding:'12px 14px 14px'}}>
        <div style={{display:'flex',alignItems:'center',gap:5,marginBottom:2,flexWrap:'wrap'}}>
          <span style={{fontSize:11,color:MT}}>{car.brand}</span>
          <span style={{fontSize:9,color:'#444'}}>·</span>
          <span style={{fontSize:11,color:MT}}>{car.year}년</span>
          {car.plateNumber&&<><span style={{fontSize:9,color:'#444'}}>·</span><span style={{fontSize:10,color:MT}}>{car.plateNumber}</span></>}
        </div>
        <h3 style={{fontSize:15,fontWeight:700,marginBottom:1}}>{car.model}</h3>
        <p style={{fontSize:11,color:MT,marginBottom:10,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{car.trim}</p>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end'}}>
          <div>
            <span style={{fontSize:10,color:MT}}>월 </span>
            <span style={{fontSize:19,fontWeight:800,color:done?'#666':G,textDecoration:done?'line-through':'none'}}>{fmt(car.monthlyPayment)}</span>
            <span style={{fontSize:10,color:MT}}>원</span>
          </div>
          <span style={{fontSize:10,color:MT,background:'rgba(255,255,255,.04)',padding:'2px 7px',borderRadius:4}}>잔여 {car.remainingMonths}개월</span>
        </div>
        <div style={{display:'flex',gap:8,marginTop:8,paddingTop:8,borderTop:`1px solid ${BD}`,flexWrap:'wrap'}}>
          <span style={{fontSize:10,color:MT,display:'flex',alignItems:'center',gap:2}}>{ic.pin}{car.region}</span>
          <span style={{fontSize:10,color:MT,display:'flex',alignItems:'center',gap:2}}>{ic.eye}{fmt(car.views||0)}</span>
          <span style={{fontSize:10,color:MT,display:'flex',alignItems:'center',gap:2}}>{ic.fuel}{car.fuelType}</span>
        </div>
      </div>
    </div>
  );
}

// ── Detail Modal ──
function Detail({car,onClose,onInquiry}){
  const [showForm,setShowForm]=useState(false);
  const [form,setForm]=useState({name:'',phone:'',message:''});
  const [sent,setSent]=useState(false);
  const [lightbox,setLightbox]=useState(null); // index or null
  const done=car.status==='completed';

  const submit=()=>{
    if(!form.name||!form.phone){alert('이름과 연락처를 입력해주세요.');return}
    onInquiry({...form,carId:car.id,carName:`${car.brand} ${car.model}`,managerPhone:car.managerPhone||'',status:'new'});
    setSent(true);
    setTimeout(()=>{setSent(false);setShowForm(false);setForm({name:'',phone:'',message:''})},2500);
  };

  const Row=({l,v,hl})=>(
    <div style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:`1px solid ${BD}`}}>
      <span style={{fontSize:13,color:MT}}>{l}</span>
      <span style={{fontSize:13,fontWeight:hl?700:500,color:hl?G:TX}}>{v}</span>
    </div>
  );

  return(
    <div style={{position:'fixed',inset:0,zIndex:200,background:'rgba(0,0,0,.85)',overflow:'auto',WebkitOverflowScrolling:'touch'}} onClick={onClose}>
      <div style={{maxWidth:660,margin:'16px auto',background:DB,borderRadius:14,border:`1px solid ${done?'rgba(229,57,53,.25)':BD}`,overflow:'hidden',animation:'fadeIn .25s ease-out'}} onClick={e=>e.stopPropagation()}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 16px',borderBottom:`1px solid ${BD}`}}>
          <button className="btn bg bs" onClick={onClose}>{ic.back} 뒤로</button>
          <div style={{display:'flex',gap:4}}>
            <span className={`badge ${car.contractType==='렌트'?'b-rent':'b-lease'}`}>{car.contractType}</span>
            {car.isPremium&&<span className="badge b-prem">★</span>}
            {done&&<span className="badge b-done">승계완료</span>}
          </div>
        </div>

        <div style={{position:'relative'}}>
          <Gallery images={car.images||[]} h={280} onImageClick={(idx)=>setLightbox(idx)}/>
          {done&&<div style={{position:'absolute',inset:0,background:'rgba(0,0,0,.6)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:5,pointerEvents:'none'}}>
            <div style={{background:'rgba(229,57,53,.92)',color:'#fff',padding:'12px 32px',borderRadius:10,fontWeight:900,fontSize:20,letterSpacing:2,transform:'rotate(-5deg)',border:'3px solid rgba(255,255,255,.3)'}}>승계완료</div>
          </div>}
        </div>

        {lightbox!==null&&(car.images||[]).length>0&&<Lightbox images={car.images} startIdx={lightbox} onClose={()=>setLightbox(null)}/>}

        <div style={{padding:'18px 18px 24px'}}>
          <span style={{fontSize:12,color:MT}}>{car.brand} · {car.year}년식{car.plateNumber?` · ${car.plateNumber}`:''}</span>
          <h2 style={{fontSize:20,fontWeight:800,marginTop:2}}>{car.model}</h2>
          <p style={{fontSize:12,color:MT,marginTop:1}}>{car.trim}</p>

          <div style={{background:done?'rgba(229,57,53,.08)':'rgba(245,208,0,.06)',border:`1px solid ${done?'rgba(229,57,53,.2)':'rgba(245,208,0,.15)'}`,borderRadius:10,padding:16,marginTop:16,textAlign:'center'}}>
            <span style={{fontSize:11,color:MT}}>월 납입금</span>
            <div style={{fontSize:28,fontWeight:900,color:done?RD:G,marginTop:2}}>{fmt(car.monthlyPayment)}<span style={{fontSize:14}}>원</span></div>
            <span style={{fontSize:11,color:MT}}>× 잔여 {car.remainingMonths}개월</span>
          </div>

          <h4 style={{fontSize:13,fontWeight:700,marginTop:22,marginBottom:8,display:'flex',alignItems:'center',gap:5}}>{ic.shield} 계약 정보</h4>
          <div style={{background:CD,borderRadius:8,padding:'2px 14px',border:`1px solid ${BD}`}}>
            <Row l="계약 유형" v={car.contractType}/>
            <Row l="캐피탈/렌탈사" v={car.capitalCompany||'-'}/>
            <Row l="총 계약 기간" v={`${car.totalContractMonths||0}개월`}/>
            <Row l="잔여 개월" v={`${car.remainingMonths||0}개월`} hl/>
            <Row l="계약 만기일" v={car.contractEndDate||'-'}/>
            <Row l="보증금" v={car.deposit>0?`${fmt(car.deposit)}원`:'없음'}/>
            <Row l="인수금" v={car.acquisitionCost>0?`${fmt(car.acquisitionCost)}원`:'없음'}/>
            <Row l="지원금" v={car.supportAmount>0?`${fmt(car.supportAmount)}원`:'없음'} hl={car.supportAmount>0}/>
          </div>

          <h4 style={{fontSize:13,fontWeight:700,marginTop:22,marginBottom:8,display:'flex',alignItems:'center',gap:5}}>{ic.car} 차량 정보</h4>
          <div style={{background:CD,borderRadius:8,padding:'2px 14px',border:`1px solid ${BD}`}}>
            <Row l="차량번호" v={car.plateNumber||'-'}/>
            <Row l="연식" v={`${car.year}년`}/>
            <Row l="색상" v={car.color||'-'}/>
            <Row l="연료" v={car.fuelType}/>
            <Row l="인승" v={car.seating}/>
            <Row l="변속기" v={car.transmission}/>
            <Row l="연간 약정 주행거리" v={`${fmt(car.annualMileage||0)}km`}/>
            <Row l="현재 주행거리" v={`${fmt(car.currentMileage||0)}km`}/>
            <Row l="지역" v={car.region||'-'}/>
          </div>

          {car.options?.length>0&&<>
            <h4 style={{fontSize:13,fontWeight:700,marginTop:22,marginBottom:8}}>주요 옵션</h4>
            <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
              {car.options.map((o,i)=><span key={i} style={{background:'rgba(245,208,0,.06)',border:'1px solid rgba(245,208,0,.15)',color:G,padding:'4px 10px',borderRadius:16,fontSize:11,display:'flex',alignItems:'center',gap:3}}>{ic.check}{o}</span>)}
            </div>
          </>}

          {car.description&&<>
            <h4 style={{fontSize:13,fontWeight:700,marginTop:22,marginBottom:8}}>상세 설명</h4>
            <div style={{background:CD,borderRadius:8,padding:12,border:`1px solid ${BD}`,fontSize:13,lineHeight:1.7,color:MT,whiteSpace:'pre-wrap'}}>{car.description}</div>
          </>}

          {!done&&<div style={{marginTop:22}}>
            {car.managerPhone&&<div style={{background:'rgba(245,208,0,.06)',border:'1px solid rgba(245,208,0,.15)',borderRadius:10,padding:12,marginBottom:12,display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:8}}>
              <div><span style={{fontSize:11,color:MT}}>담당자</span><div style={{fontSize:15,fontWeight:700,color:G,marginTop:1}}>{car.managerName||'담당자'} · {car.managerPhone}</div></div>
              <a href={`tel:${car.managerPhone}`} className="btn bp bs" style={{textDecoration:'none'}}>{ic.phone} 전화</a>
            </div>}
            <div style={{display:'flex',gap:8}}>
              <a href={`tel:${TEL}`} className="btn bo" style={{flex:1,textDecoration:'none'}}>{ic.phone} 대표전화</a>
              <button className="btn bp" style={{flex:1}} onClick={()=>setShowForm(true)}>승계 문의하기</button>
            </div>
          </div>}

          {done&&<div style={{marginTop:22,textAlign:'center',padding:18,background:'rgba(229,57,53,.08)',borderRadius:10,border:'1px solid rgba(229,57,53,.2)'}}>
            <div style={{fontSize:16,fontWeight:800,color:RD}}>이 차량은 승계가 완료되었습니다</div>
            <p style={{fontSize:12,color:MT,marginTop:4}}>다른 차량을 확인해보세요</p>
          </div>}

          {showForm&&!done&&<div style={{marginTop:14,background:CD,borderRadius:10,padding:16,border:`1px solid rgba(245,208,0,.2)`,animation:'fadeIn .2s ease-out'}}>
            {sent?<div style={{textAlign:'center',padding:14}}><div style={{fontSize:32,marginBottom:6}}>✅</div><h4 style={{fontSize:14,fontWeight:700}}>문의 접수 완료!</h4><p style={{fontSize:12,color:MT,marginTop:4}}>담당자가 빠르게 연락드리겠습니다.</p></div>
            :<>
              <h4 style={{fontSize:13,fontWeight:700,marginBottom:12}}>승계 문의</h4>
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                <CI placeholder="이름 *" value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))}/>
                <CI placeholder="연락처 * (010-1234-5678)" value={form.phone} onChange={e=>setForm(p=>({...p,phone:e.target.value}))}/>
                <CT placeholder="문의사항 (선택)" value={form.message} onChange={e=>setForm(p=>({...p,message:e.target.value}))} rows={3}/>
                <div style={{display:'flex',gap:6}}>
                  <button className="btn bg" style={{flex:1}} onClick={()=>setShowForm(false)}>취소</button>
                  <button className="btn bp" style={{flex:1}} onClick={submit}>문의 접수</button>
                </div>
              </div>
            </>}
          </div>}
        </div>
      </div>
    </div>
  );
}

// ── Admin Car Form ──
function CarForm({car,onSave,onCancel}){
  const [f,sF]=useState(()=>car?{...car,images:car.images||[]}:{
    brand:'',model:'',year:2025,trim:'',contractType:'렌트',
    monthlyPayment:'',remainingMonths:'',totalContractMonths:60,
    deposit:0,acquisitionCost:'',supportAmount:0,annualMileage:20000,
    currentMileage:'',fuelType:'가솔린',color:'',seating:'5인승',
    region:'',capitalCompany:'',contractEndDate:'',transmission:'자동',
    images:[],description:'',options:[],status:'active',views:0,
    isPremium:false,plateNumber:'',managerName:'',managerPhone:''
  });
  const [opt,setOpt]=useState('');
  const [saving,setSaving]=useState(false);
  const s=(k,v)=>sF(p=>({...p,[k]:v}));

  const save=async()=>{
    if(!f.brand||!f.model||!f.monthlyPayment){alert('브랜드, 모델명, 월 납입금은 필수입니다.');return}
    setSaving(true);
    try{
      await onSave({
        ...f,
        monthlyPayment:Number(f.monthlyPayment)||0,
        remainingMonths:Number(f.remainingMonths)||0,
        totalContractMonths:Number(f.totalContractMonths)||0,
        deposit:Number(f.deposit)||0,
        acquisitionCost:Number(f.acquisitionCost)||0,
        supportAmount:Number(f.supportAmount)||0,
        annualMileage:Number(f.annualMileage)||0,
        currentMileage:Number(f.currentMileage)||0,
        year:Number(f.year)||2025,
        views:Number(f.views)||0,
      });
    }catch(err){alert('저장 중 오류: '+err.message)}
    setSaving(false);
  };

  const F=({l,children,req})=>(<div><label style={{fontSize:11,fontWeight:600,color:MT,marginBottom:4,display:'block'}}>{l}{req&&<span style={{color:RD}}> *</span>}</label>{children}</div>);

  return(
    <div style={{background:CD,borderRadius:12,border:`1px solid ${BD}`,padding:20,animation:'fadeIn .2s ease-out'}}>
      <h3 style={{fontSize:16,fontWeight:700,marginBottom:18,display:'flex',alignItems:'center',gap:6}}>{ic.car} {car?'차량 수정':'새 차량 등록'}</h3>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:12}}>
        <F l="브랜드" req><select value={f.brand} onChange={e=>s('brand',e.target.value)}><option value="">선택</option>{BRANDS.filter(b=>b!=='전체').map(b=><option key={b}>{b}</option>)}</select></F>
        <F l="모델명" req><CI value={f.model} onChange={e=>s('model',e.target.value)} placeholder="GV80"/></F>
        <F l="연식"><select value={f.year} onChange={e=>s('year',e.target.value)}>{[2026,2025,2024,2023,2022,2021,2020,2019].map(y=><option key={y}>{y}</option>)}</select></F>
        <F l="등급/트림"><CI value={f.trim} onChange={e=>s('trim',e.target.value)} placeholder="가솔린 2.5 터보"/></F>
        <F l="차량번호"><CI value={f.plateNumber||''} onChange={e=>s('plateNumber',e.target.value)} placeholder="12가 3456"/></F>
        <F l="계약 유형"><select value={f.contractType} onChange={e=>s('contractType',e.target.value)}><option>렌트</option><option>리스</option></select></F>
        <F l="캐피탈/렌탈사"><CI value={f.capitalCompany||''} onChange={e=>s('capitalCompany',e.target.value)} placeholder="현대캐피탈"/></F>
        <F l="월 납입금 (원)" req><CI type="number" value={f.monthlyPayment} onChange={e=>s('monthlyPayment',e.target.value)} placeholder="526747"/></F>
        <F l="총 계약기간 (개월)"><CI type="number" value={f.totalContractMonths} onChange={e=>s('totalContractMonths',e.target.value)}/></F>
        <F l="잔여 개월"><CI type="number" value={f.remainingMonths} onChange={e=>s('remainingMonths',e.target.value)} placeholder="36"/></F>
        <F l="계약 만기일"><CI type="month" value={f.contractEndDate||''} onChange={e=>s('contractEndDate',e.target.value)}/></F>
        <F l="보증금 (원)"><CI type="number" value={f.deposit} onChange={e=>s('deposit',e.target.value)}/></F>
        <F l="인수금 (원)"><CI type="number" value={f.acquisitionCost} onChange={e=>s('acquisitionCost',e.target.value)}/></F>
        <F l="승계 지원금 (원)"><CI type="number" value={f.supportAmount} onChange={e=>s('supportAmount',e.target.value)}/></F>
        <F l="연료"><select value={f.fuelType} onChange={e=>s('fuelType',e.target.value)}>{['가솔린','디젤','하이브리드','전기','LPG'].map(x=><option key={x}>{x}</option>)}</select></F>
        <F l="색상"><CI value={f.color||''} onChange={e=>s('color',e.target.value)} placeholder="마틴 그레이"/></F>
        <F l="인승"><select value={f.seating} onChange={e=>s('seating',e.target.value)}>{['2인승','4인승','5인승','7인승','9인승','11인승'].map(x=><option key={x}>{x}</option>)}</select></F>
        <F l="변속기"><select value={f.transmission} onChange={e=>s('transmission',e.target.value)}><option>자동</option><option>수동</option></select></F>
        <F l="약정 주행거리 (km/년)"><CI type="number" value={f.annualMileage} onChange={e=>s('annualMileage',e.target.value)}/></F>
        <F l="현재 주행거리 (km)"><CI type="number" value={f.currentMileage} onChange={e=>s('currentMileage',e.target.value)}/></F>
        <F l="지역"><CI value={f.region||''} onChange={e=>s('region',e.target.value)} placeholder="서울 강남구"/></F>
        <F l="조회수 (수동)"><CI type="number" value={f.views} onChange={e=>s('views',e.target.value)}/></F>
      </div>

      <div style={{marginTop:14,padding:14,background:DB,borderRadius:8,border:`1px solid ${BD}`}}>
        <h4 style={{fontSize:12,fontWeight:700,marginBottom:10,color:G,display:'flex',alignItems:'center',gap:5}}>{ic.user} 담당자 정보</h4>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          <F l="담당자명"><CI value={f.managerName||''} onChange={e=>s('managerName',e.target.value)} placeholder="홍길동"/></F>
          <F l="담당자 연락처"><CI value={f.managerPhone||''} onChange={e=>s('managerPhone',e.target.value)} placeholder="010-1234-5678"/></F>
        </div>
      </div>

      <div style={{display:'flex',gap:16,marginTop:14,flexWrap:'wrap'}}>
        <label style={{display:'flex',alignItems:'center',gap:6,cursor:'pointer',fontSize:12}}>
          <input type="checkbox" checked={f.isPremium} onChange={e=>s('isPremium',e.target.checked)} style={{width:16,height:16,accentColor:G}}/> ★ 프리미엄 차량
        </label>
        <label style={{display:'flex',alignItems:'center',gap:6,fontSize:12,color:MT}}>
          상태: <select value={f.status||'active'} onChange={e=>s('status',e.target.value)} style={{width:'auto',padding:'4px 28px 4px 8px'}}><option value="active">승계 중</option><option value="completed">승계완료</option></select>
        </label>
      </div>

      <div style={{marginTop:14}}><ImgUploader images={f.images||[]} setImages={v=>s('images',typeof v==='function'?v(f.images||[]):v)}/></div>

      <div style={{marginTop:14}}>
        <label style={{fontSize:11,fontWeight:600,color:MT,marginBottom:4,display:'block'}}>옵션</label>
        <div style={{display:'flex',gap:6}}>
          <CI value={opt} onChange={e=>setOpt(e.target.value)} placeholder="옵션 입력" onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();if(opt.trim()){s('options',[...(f.options||[]),opt.trim()]);setOpt('')}}}} style={{flex:1}}/>
          <button className="btn bo bs" onClick={()=>{if(opt.trim()){s('options',[...(f.options||[]),opt.trim()]);setOpt('')}}}>추가</button>
        </div>
        {f.options?.length>0&&<div style={{display:'flex',flexWrap:'wrap',gap:5,marginTop:6}}>
          {f.options.map((o,i)=><span key={i} style={{background:'rgba(245,208,0,.08)',color:G,padding:'3px 9px',borderRadius:12,fontSize:10,display:'flex',alignItems:'center',gap:3,cursor:'pointer'}} onClick={()=>s('options',f.options.filter((_,j)=>j!==i))}>{o} ×</span>)}
        </div>}
      </div>

      <div style={{marginTop:14}}>
        <label style={{fontSize:11,fontWeight:600,color:MT,marginBottom:4,display:'block'}}>상세 설명</label>
        <CT value={f.description||''} onChange={e=>s('description',e.target.value)} rows={4} placeholder="차량 상태, 승계 사유 등"/>
      </div>

      <div style={{display:'flex',gap:8,marginTop:18}}>
        <button className="btn bg" style={{flex:1}} onClick={onCancel} disabled={saving}>취소</button>
        <button className="btn bp" style={{flex:1}} onClick={save} disabled={saving}>{saving?'저장중...':car?'수정 완료':'차량 등록'}</button>
      </div>
    </div>
  );
}

// ── Admin ──
function Admin({cars,inquiries}){
  const [tab,setTab]=useState('cars');
  const [edit,setEdit]=useState(null);
  const [showForm,setShowForm]=useState(false);

  const saveCar=async(data)=>{
    try{
      if(edit){
        const{id,...rest}=data;
        await updateCar(id,rest);
      }else{
        await addCar(data);
      }
      setShowForm(false);setEdit(null);
    }catch(err){console.error(err);alert('저장 실패: '+err.message)}
  };

  const delCar=async(id)=>{
    if(!confirm('정말 삭제하시겠습니까?'))return;
    try{await deleteCar(id)}catch(err){alert('삭제 실패: '+err.message)}
  };

  const toggleDone=async(car)=>{
    const ns=car.status==='completed'?'active':'completed';
    try{await updateCar(car.id,{status:ns})}catch(err){alert('상태 변경 실패')}
  };

  const updInq=async(id,status)=>{
    try{await updateInquiry(id,{status})}catch(err){alert('상태 변경 실패')}
  };

  const delInq=async(id)=>{
    if(!confirm('문의를 삭제하시겠습니까?'))return;
    try{await deleteInquiry(id)}catch(err){alert('삭제 실패')}
  };

  const ac=cars.filter(c=>c.status==='active').length;
  const cc=cars.filter(c=>c.status==='completed').length;
  const ni=inquiries.filter(q=>q.status==='new').length;

  return(
    <div style={{maxWidth:1280,margin:'0 auto',padding:'16px 16px 60px'}}>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(120px,1fr))',gap:10,marginBottom:16}}>
        {[{l:'전체 차량',v:cars.length,c:TX},{l:'승계 중',v:ac,c:GR},{l:'승계완료',v:cc,c:RD},{l:'신규 문의',v:ni,c:G}].map((s,i)=>(
          <div key={i} style={{background:CD,borderRadius:8,padding:'12px 14px',border:`1px solid ${BD}`}}>
            <span style={{fontSize:10,color:MT}}>{s.l}</span>
            <div style={{fontSize:22,fontWeight:800,color:s.c,marginTop:1}}>{s.v}</div>
          </div>
        ))}
      </div>

      <div style={{display:'flex',borderBottom:`1px solid ${BD}`,marginBottom:16,overflowX:'auto'}}>
        <button className={`tab ${tab==='cars'?'active':''}`} onClick={()=>{setTab('cars');setShowForm(false)}}>{ic.car} 차량</button>
        <button className={`tab ${tab==='inquiries'?'active':''}`} onClick={()=>setTab('inquiries')}>
          {ic.inbox} 문의{ni>0&&<span style={{background:RD,color:'#fff',fontSize:9,fontWeight:700,padding:'1px 5px',borderRadius:8,marginLeft:4}}>{ni}</span>}
        </button>
      </div>

      {tab==='cars'&&<>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
          <h3 style={{fontSize:15,fontWeight:700}}>차량 목록 ({cars.length})</h3>
          {!showForm&&<button className="btn bp bs" onClick={()=>{setShowForm(true);setEdit(null)}}>{ic.plus} 등록</button>}
        </div>
        {showForm&&<div style={{marginBottom:16}}><CarForm car={edit} onSave={saveCar} onCancel={()=>{setShowForm(false);setEdit(null)}}/></div>}
        <div style={{background:CD,borderRadius:10,border:`1px solid ${BD}`,overflow:'hidden'}}>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:11,minWidth:800}}>
              <thead><tr style={{borderBottom:`1px solid ${BD}`,background:'rgba(245,208,0,.03)'}}>
                {['','유형','브랜드/모델','차량번호','월납입금','잔여','지원금','담당자','조회','관리'].map(h=><th key={h} style={{padding:'9px 10px',textAlign:'left',fontWeight:600,color:MT,whiteSpace:'nowrap',fontSize:10}}>{h}</th>)}
              </tr></thead>
              <tbody>{cars.map(car=>(
                <tr key={car.id} style={{borderBottom:`1px solid ${BD}`}}>
                  <td style={{padding:'8px 10px'}}><span style={{width:7,height:7,borderRadius:'50%',display:'inline-block',background:car.status==='active'?GR:RD}}/></td>
                  <td style={{padding:'8px 10px'}}><span className={`badge ${car.contractType==='렌트'?'b-rent':'b-lease'}`} style={{fontSize:9}}>{car.contractType}</span></td>
                  <td style={{padding:'8px 10px',fontWeight:600,whiteSpace:'nowrap'}}>{car.brand} {car.model}{car.isPremium&&<span style={{color:G,fontSize:9,marginLeft:3}}>★</span>}</td>
                  <td style={{padding:'8px 10px',color:MT,fontSize:10}}>{car.plateNumber||'-'}</td>
                  <td style={{padding:'8px 10px',color:G,fontWeight:600}}>{fmt(car.monthlyPayment)}원</td>
                  <td style={{padding:'8px 10px',color:MT}}>{car.remainingMonths}개월</td>
                  <td style={{padding:'8px 10px',color:car.supportAmount>0?G:MT}}>{car.supportAmount>0?fmtW(car.supportAmount)+'원':'-'}</td>
                  <td style={{padding:'8px 10px',color:MT,fontSize:10,whiteSpace:'nowrap'}}>{car.managerName||'-'}<br/>{car.managerPhone||''}</td>
                  <td style={{padding:'8px 10px',color:MT}}>{fmt(car.views||0)}</td>
                  <td style={{padding:'8px 10px',whiteSpace:'nowrap'}}>
                    <div style={{display:'flex',gap:2}}>
                      <button className="btn bg" style={{padding:'3px 5px',minWidth:0}} title={car.status==='active'?'승계완료 처리':'되돌리기'} onClick={()=>toggleDone(car)}>{ic.checkCircle}</button>
                      <button className="btn bg" style={{padding:'3px 5px',minWidth:0}} onClick={()=>{setEdit(car);setShowForm(true)}}>{ic.edit}</button>
                      <button className="btn bg" style={{padding:'3px 5px',minWidth:0,color:RD}} onClick={()=>delCar(car.id)}>{ic.trash}</button>
                    </div>
                  </td>
                </tr>
              ))}{cars.length===0&&<tr><td colSpan={10} style={{padding:30,textAlign:'center',color:MT}}>등록된 차량이 없습니다</td></tr>}</tbody>
            </table>
          </div>
        </div>
      </>}

      {tab==='inquiries'&&<>
        <h3 style={{fontSize:15,fontWeight:700,marginBottom:12}}>문의 목록 ({inquiries.length})</h3>
        <div style={{background:CD,borderRadius:10,border:`1px solid ${BD}`,overflow:'hidden'}}>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:11,minWidth:700}}>
              <thead><tr style={{borderBottom:`1px solid ${BD}`,background:'rgba(245,208,0,.03)'}}>
                {['상태','이름','연락처','차량','담당자','내용','날짜','처리'].map(h=><th key={h} style={{padding:'9px 10px',textAlign:'left',fontWeight:600,color:MT,whiteSpace:'nowrap',fontSize:10}}>{h}</th>)}
              </tr></thead>
              <tbody>{inquiries.map(q=>(
                <tr key={q.id} style={{borderBottom:`1px solid ${BD}`,background:q.status==='new'?'rgba(245,208,0,.03)':'transparent'}}>
                  <td style={{padding:'8px 10px'}}>
                    <span className="badge" style={{background:q.status==='new'?'rgba(245,208,0,.12)':q.status==='processing'?'rgba(100,181,246,.12)':'rgba(76,175,80,.12)',color:q.status==='new'?G:q.status==='processing'?BL:GR,border:`1px solid ${q.status==='new'?'rgba(245,208,0,.25)':q.status==='processing'?'rgba(100,181,246,.25)':'rgba(76,175,80,.25)'}`,fontSize:9}}>
                      {q.status==='new'?'신규':q.status==='processing'?'처리중':'완료'}
                    </span>
                  </td>
                  <td style={{padding:'8px 10px',fontWeight:600}}>{q.name}</td>
                  <td style={{padding:'8px 10px'}}><a href={`tel:${q.phone}`} style={{color:G,textDecoration:'none'}}>{q.phone}</a></td>
                  <td style={{padding:'8px 10px',color:MT,whiteSpace:'nowrap'}}>{q.carName}</td>
                  <td style={{padding:'8px 10px',color:MT,fontSize:10}}>{q.managerPhone||'-'}</td>
                  <td style={{padding:'8px 10px',color:MT,maxWidth:160,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{q.message||'-'}</td>
                  <td style={{padding:'8px 10px',color:MT,whiteSpace:'nowrap',fontSize:10}}>{q.createdAt?.toDate?.().toLocaleDateString?.('ko-KR')||q.createdAt||'-'}</td>
                  <td style={{padding:'8px 10px',whiteSpace:'nowrap'}}>
                    <div style={{display:'flex',gap:2,alignItems:'center'}}>
                      <select value={q.status} onChange={e=>updInq(q.id,e.target.value)} style={{width:'auto',padding:'3px 24px 3px 6px',fontSize:10,borderRadius:4}}>
                        <option value="new">신규</option><option value="processing">처리중</option><option value="done">완료</option>
                      </select>
                      <button className="btn bg" style={{padding:'3px 5px',minWidth:0,color:RD}} onClick={()=>delInq(q.id)}>{ic.trash}</button>
                    </div>
                  </td>
                </tr>
              ))}{inquiries.length===0&&<tr><td colSpan={8} style={{padding:30,textAlign:'center',color:MT}}>문의가 없습니다</td></tr>}</tbody>
            </table>
          </div>
        </div>
      </>}
    </div>
  );
}

// ── Home ──
function Home({cars,onSelect}){
  const [q,setQ]=useState('');
  const [brand,setBrand]=useState('전체');
  const [fuel,setFuel]=useState('전체');
  const [cType,setCType]=useState('전체');
  const [sort,setSort]=useState('latest');
  const [sf,setSf]=useState(false);
  const [status,setStatus]=useState('active');

  const filtered=useMemo(()=>{
    return cars.filter(c=>{
      const s=q.toLowerCase().trim();
      const mS=!s||c.brand?.toLowerCase().includes(s)||c.model?.toLowerCase().includes(s)||c.trim?.toLowerCase().includes(s)||c.region?.includes(s)||c.color?.includes(s)||c.plateNumber?.includes(s)||(c.plateNumber?.replace(/\s/g,'')?.includes(s.replace(/\s/g,'')));
      const mB=brand==='전체'||c.brand===brand;
      const mF=fuel==='전체'||c.fuelType===fuel;
      const mC=cType==='전체'||c.contractType===cType;
      const mSt=status==='all'?true:c.status===status;
      return mS&&mB&&mF&&mC&&mSt;
    });
  },[cars,q,brand,fuel,cType,status]);

  const sorted=useMemo(()=>[...filtered].sort((a,b)=>{
    if(sort==='price-asc')return(a.monthlyPayment||0)-(b.monthlyPayment||0);
    if(sort==='price-desc')return(b.monthlyPayment||0)-(a.monthlyPayment||0);
    if(sort==='views')return(b.views||0)-(a.views||0);
    return 0; // Firestore already sorts by createdAt desc
  }),[filtered,sort]);

  const prem=sorted.filter(c=>c.isPremium);
  const gen=sorted.filter(c=>!c.isPremium);

  return(<div>
    <section style={{background:'linear-gradient(180deg,rgba(245,208,0,.05),transparent)',padding:'36px 16px 20px',textAlign:'center',position:'relative'}}>
      <div style={{position:'absolute',top:-80,left:'50%',transform:'translateX(-50%)',width:500,height:500,background:'radial-gradient(circle,rgba(245,208,0,.05),transparent 70%)',pointerEvents:'none'}}/>
      <div style={{maxWidth:1280,margin:'0 auto',position:'relative'}}>
        <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:'clamp(24px,5vw,38px)',fontWeight:900}}><span style={{color:G}}>CARON</span> 승계차량</h1>
        <p style={{color:MT,fontSize:13,marginTop:8}}>장기렌트 · 리스 승계 차량을 한눈에 비교하고, 전문 담당자에게 바로 상담받으세요.</p>

        <div style={{maxWidth:540,margin:'20px auto 0',position:'relative'}}>
          <div style={{position:'absolute',left:14,top:'50%',transform:'translateY(-50%)',color:MT,zIndex:1}}>{ic.search}</div>
          <CI value={q} onChange={e=>setQ(e.target.value)} placeholder="차량명, 브랜드, 지역, 색상, 차량번호 검색" style={{paddingLeft:40,height:46,fontSize:14,borderRadius:23,background:'rgba(26,26,26,.85)'}}/>
        </div>

        <div style={{display:'flex',flexWrap:'wrap',justifyContent:'center',gap:6,marginTop:14}}>
          {['전체','렌트','리스'].map(c=>(
            <button key={c} className="btn bs" onClick={()=>setCType(c)} style={{background:cType===c?G:'transparent',color:cType===c?BK:MT,border:`1px solid ${cType===c?G:BD}`,borderRadius:18,fontSize:12}}>{c}</button>
          ))}
          <div style={{width:1,height:22,background:BD,margin:'0 2px'}}/>
          {[{v:'active',l:'승계 중'},{v:'all',l:'전체'},{v:'completed',l:'승계완료'}].map(x=>(
            <button key={x.v} className="btn bs" onClick={()=>setStatus(x.v)} style={{background:status===x.v?(x.v==='completed'?RD:G):'transparent',color:status===x.v?'#fff':MT,border:`1px solid ${status===x.v?(x.v==='completed'?RD:G):BD}`,borderRadius:18,fontSize:12}}>{x.l}</button>
          ))}
          <button className="btn bs" onClick={()=>setSf(!sf)} style={{background:sf?'rgba(245,208,0,.06)':'transparent',color:sf?G:MT,border:`1px solid ${sf?'rgba(245,208,0,.3)':BD}`,borderRadius:18,fontSize:12}}>{ic.filter} 상세</button>
        </div>

        {sf&&<div style={{maxWidth:560,margin:'12px auto 0',background:CD,borderRadius:10,padding:14,border:`1px solid ${BD}`,animation:'fadeIn .15s ease-out',textAlign:'left'}}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(130px,1fr))',gap:10}}>
            <div><label style={{fontSize:10,color:MT,marginBottom:2,display:'block'}}>브랜드</label><select value={brand} onChange={e=>setBrand(e.target.value)}>{BRANDS.map(b=><option key={b}>{b}</option>)}</select></div>
            <div><label style={{fontSize:10,color:MT,marginBottom:2,display:'block'}}>연료</label><select value={fuel} onChange={e=>setFuel(e.target.value)}>{FUELS.map(f=><option key={f}>{f}</option>)}</select></div>
            <div><label style={{fontSize:10,color:MT,marginBottom:2,display:'block'}}>정렬</label><select value={sort} onChange={e=>setSort(e.target.value)}><option value="latest">최신순</option><option value="price-asc">가격↑</option><option value="price-desc">가격↓</option><option value="views">인기순</option></select></div>
          </div>
        </div>}
      </div>
    </section>

    <div style={{maxWidth:1280,margin:'0 auto',padding:'0 16px 60px'}}>
      {prem.length>0&&<section style={{marginTop:24}}>
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14}}>
          <div style={{color:G}}>{ic.crown}</div>
          <h2 style={{fontSize:16,fontWeight:800}}>프리미엄 승계차량</h2>
          <span style={{fontSize:11,color:G}}>{prem.length}대</span>
          <div style={{height:1,flex:1,background:`linear-gradient(90deg,${BD},transparent)`}}/>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:14}}>
          {prem.map(c=><CarCard key={c.id} car={c} onClick={()=>onSelect(c)}/>)}
        </div>
      </section>}

      <section style={{marginTop:28}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14,flexWrap:'wrap',gap:8}}>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <h2 style={{fontSize:16,fontWeight:800}}>일반 승계차량</h2>
            <span style={{fontSize:11,color:MT}}>{gen.length}대</span>
          </div>
          <select value={sort} onChange={e=>setSort(e.target.value)} style={{width:'auto',padding:'4px 30px 4px 10px',fontSize:11,borderRadius:6}}>
            <option value="latest">최신순</option><option value="price-asc">가격↑</option><option value="price-desc">가격↓</option><option value="views">인기순</option>
          </select>
        </div>
        {gen.length===0&&prem.length===0?
          <div style={{textAlign:'center',padding:'50px 16px',color:MT}}><div style={{fontSize:40,marginBottom:10}}>🚗</div><p style={{fontSize:14}}>검색 결과가 없습니다.</p><p style={{fontSize:11,marginTop:4}}>다른 조건으로 검색해보세요.</p></div>
        :gen.length===0?<div style={{textAlign:'center',padding:'30px 16px',color:MT}}><p style={{fontSize:13}}>일반 차량이 없습니다.</p></div>
        :<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:14}}>
          {gen.map(c=><CarCard key={c.id} car={c} onClick={()=>onSelect(c)}/>)}
        </div>}
      </section>
    </div>

    <a href={`tel:${TEL}`} style={{position:'fixed',bottom:18,right:18,zIndex:50,background:G,color:BK,width:52,height:52,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 4px 18px rgba(245,208,0,.3)',textDecoration:'none',transition:'transform .15s'}} onMouseEnter={e=>e.currentTarget.style.transform='scale(1.1)'} onMouseLeave={e=>e.currentTarget.style.transform='scale(1)'}>{ic.phone}</a>

    <footer style={{borderTop:`1px solid ${BD}`,padding:'24px 16px',textAlign:'center'}}>
      <span style={{fontFamily:"'Playfair Display',serif",fontSize:16,fontWeight:800,color:G,letterSpacing:2}}>CARON</span>
      <p style={{fontSize:10,color:MT,marginTop:4}}>신차 장기렌트 & 리스 승계 전문</p>
      <p style={{fontSize:10,color:'#555',marginTop:8}}>대표전화: {TEL}</p>
      <p style={{fontSize:9,color:'#444',marginTop:4}}>© 2025 CARON. All rights reserved.</p>
    </footer>
  </div>);
}

// ═══ Main App ═══
export default function App(){
  const [cars,setCars]=useState([]);
  const [inquiries,setInquiries]=useState([]);
  const [page,setPage]=useState('home');
  const [isAdmin,setIsAdmin]=useState(false);
  const [selected,setSelected]=useState(null);
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    let timeout;
    // Failsafe: end loading after 5 seconds no matter what
    timeout = setTimeout(()=>setLoading(false), 5000);

    const unsubCars=subscribeCars(
      (data)=>{setCars(data);setLoading(false);clearTimeout(timeout)},
      (err)=>{console.error(err);setLoading(false);clearTimeout(timeout)}
    );
    const unsubInq=subscribeInquiries(
      setInquiries,
      (err)=>console.error(err)
    );
    return()=>{unsubCars();unsubInq();clearTimeout(timeout)};
  },[]);

  const handleInquiry=async(data)=>{
    try{await fbAddInquiry(data)}catch(err){console.error('Inquiry error:',err)}
  };

  // Sync selected car with live data
  useEffect(()=>{
    if(selected){
      const updated=cars.find(c=>c.id===selected.id);
      if(updated)setSelected(updated);
    }
  },[cars]);

  if(loading)return(
    <>
      <style>{CSS}</style>
      <div style={{minHeight:'100vh',background:BK,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:16}}>
        <div className="spin" style={{color:G}}>{ic.loading}</div>
        <span style={{fontFamily:"'Playfair Display',serif",fontSize:24,fontWeight:800,color:G,letterSpacing:2}}>CARON</span>
        <span style={{fontSize:12,color:MT}}>데이터를 불러오는 중...</span>
      </div>
    </>
  );

  return(<>
    <style>{CSS}</style>
    <div style={{minHeight:'100vh',background:BK}}>
      <Header page={page} setPage={setPage} isAdmin={isAdmin} setIsAdmin={setIsAdmin}/>
      {isAdmin&&page==='admin'?<Admin cars={cars} inquiries={inquiries}/>:<Home cars={cars} onSelect={setSelected}/>}
      {selected&&<Detail car={selected} onClose={()=>setSelected(null)} onInquiry={handleInquiry}/>}
    </div>
  </>);
}

import { afterEach, expect, it, vi } from 'vitest';
import { exportOutfitsPdf } from './export-outfits-pdf';
const mocks=vi.hoisted(()=>({ capture:vi.fn(), export:vi.fn() }));
vi.mock('html2canvas',()=>({default:mocks.capture}));
vi.mock('./export-file',()=>({exportFile:mocks.export}));
vi.mock('jspdf',()=>({default:class { internal={pageSize:{getHeight:()=>297}}; addImage(){} addPage(){} output(){return new Blob();} }}));
afterEach(()=>{vi.clearAllMocks();document.body.innerHTML='';});
it('renders untrusted item and AI text literally without injecting HTML or executable URLs',async()=>{
 const payload='<img src=x onerror="alert(1)">';
 mocks.capture.mockImplementation(async(container:HTMLElement)=>{
  expect(container.textContent).toContain(payload);
  expect(container.querySelector('img,script,iframe')).toBeNull();
  expect(container.innerHTML).not.toContain('background-image: url("javascript:');
  return {height:800,width:800,toDataURL:()=> 'data:image/jpeg;base64,dGVzdA=='};
 });
 await exportOutfitsPdf([{name:payload,mood:payload,explanation:payload,items:[{name:payload,photo:'javascript:alert(1)',color_hex:'#ffffff'}]}]);
 expect(mocks.capture).toHaveBeenCalledOnce();expect(mocks.export).toHaveBeenCalledOnce();expect(document.body.children).toHaveLength(0);
});
it('removes temporary export content after a renderer failure',async()=>{
 mocks.capture.mockRejectedValue(new Error('canvas unavailable'));
 await expect(exportOutfitsPdf([{name:'Outfit',mood:null,explanation:null,items:[]}])).rejects.toThrow('canvas unavailable');
 expect(document.body.children).toHaveLength(0);
});

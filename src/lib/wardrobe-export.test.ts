import { expect, it } from 'vitest';
import { exportWardrobeItems, importedItemRow, validImportedItem } from './wardrobe-export';
import type { WardrobeItem } from './wardrobe-data';
it('preserves front/back photos and styling metadata on export and import',()=>{
 const item:WardrobeItem={id:'one',name:'Jacket',category:'outerwear',subcategory:'jacket',primary_color:'Black',color_hex:'#000000',style_tags:['casual'],pattern:'solid',texture:'leather',is_new:true,is_featured:false,photo:'https://photos.test/front.jpg',photo_back:'https://photos.test/back.jpg'};
 const exported=exportWardrobeItems([item]);expect(exported.photos).toBe('links-only');expect(validImportedItem(exported.items[0])).toBe(true);
 expect(importedItemRow({...exported.items[0],user_id:'other'},'current')).toMatchObject({user_id:'current',photo_url:item.photo,photo_back_url:item.photo_back,subcategory:'jacket',pattern:'solid',texture:'leather'});
});
it('supports older exports while rejecting malformed items and executable photo URLs',()=>{
 const old={name:'Shirt',category:'tops',primary_color:'White',photo_url:'javascript:alert(1)'};
 expect(validImportedItem(old)).toBe(true);expect(importedItemRow(old,'current')).toMatchObject({photo_url:null,photo_back_url:null});
 for(const value of [null,{...old,name:42},{...old,category:'invented'},{...old,style_tags:'not an array'}])expect(validImportedItem(value)).toBe(false);
});

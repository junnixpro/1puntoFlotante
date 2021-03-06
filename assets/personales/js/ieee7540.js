var width = {
    exp: 8,
    man: 23
  };
  
  $(function() {
    $('.bits2').on('click','span',function() {
      $(this).text(1 - $(this).text());
  
      updatevalues2();
    });
  
    $('#precision2').change(function(e) {
      var size = this.value;
      var precision = [236,112,52,23,10,4].find(function(val) {
        return val < size;
      });
      var exponent = size - precision - 1;
  
      var components = decompose2(get_bits2());
  
      width.man = precision;
      width.exp = exponent;
  
      set_bits2(components.sig, components.exp, components.man)
  
      updatevalues2();
    }).val(32);
  
    set_bits2(false, 0, [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]);
    updatevalues2();
  });
  
  function set_bits2(sign, exp, mantissa) {
    $('#sign2 > .bits2 > span').text(sign ? '1' : '0');
  
    var biased_exp = exp + Math.pow(2,(width.exp - 1)) - 1;
    var exponent_bits = $('#exponent2 > .bits2');
    exponent_bits.empty();
    for(var i = 0; i < width.exp; i++) {
      var span = document.createElement('span');
      span.append((biased_exp & 1).toString());
      biased_exp >>= 1;
      exponent_bits.prepend(span);
    }
  
    var mantissa_bits = $('#mantissa2 > .bits2');
    mantissa_bits.empty();
    for(var i = 0; i < width.man; i++) {
      var span = document.createElement('span');
      span.append(
        (i < mantissa.length) ?
          mantissa[mantissa.length-1-i].toString() :
          '0'
      );
      mantissa_bits.append(span);
    }
  
  }
  
  function updatevalues2() {
    var components = decompose2(get_bits2());
    var parts = split_point2(components);
  
    if(Array.isArray(parts)) {

      valor2= (components.sig ? '-' : '')
      + leading_decimal2(parts[0])
      + '.'+ trailing_decimal2(parts[1]);

      $('#val_binary2').text(
        (components.sig ? '-' : '')
        + (parts[0]).slice().reverse().join('')
        + '.'+ (parts[1]).slice().reverse().join('')
      );
      $('#val_precise2').text(
        (components.sig ? '-' : '')
        + leading_decimal2(parts[0])
        + '.'+ trailing_decimal2(parts[1])
      );
    }
    else {
      $('#results2').text(valor2);
      $('#val_binary2').text(parts);
      $('#val_precise2').text(parts);
    }
  }
  
  function get_bits2() {
    var bits = [];
    $('.bits2 span').each(function() {
      bits.unshift( parseInt(this.textContent) );
    });
  
    return bits;
  }
  
  function decompose2(bits) {
    return {
      sig: bits[bits.length - 1],
      exp: bits_to_int2(bits.slice(width.man, -1)) - Math.pow(2,(width.exp - 1)) + 1,
      man: bits.slice(0, width.man)
    };
  }
  
  function bits_to_int2(bits) {
    return bits.reduceRight((acc, bit) => (acc << 1) | bit);
  }
  
  function split_point2(val) {
    if(val.exp == Math.pow(2,width.exp-1)) {
      if(val.man.every(function(bit){return bit==0;}))
        return Infinity * Math.pow(-1, val.sig);
      else
        return ((val.man[width.man-1] == 0) ? 'signalling' : 'quiet') + ' NaN';
    }
  
    var lead=[0];
    if(val.exp >= 0) {
      if(val.exp <= width.man) {
        lead = val.man.slice(width.man - val.exp, width.man);
      }
      else {
        for(var i = 1; i < val.exp - width.man; i++)
          lead.push(0);
        lead = lead.concat(val.man.slice(0, width.man));
      }
      lead.push(1);
    }
  
    var trail=[0];
    if(val.exp < width.man) {
      if(val.exp >= 0) {
        trail = val.man.slice(0, width.man - val.exp);
      }
      else {
        if(val.exp == 1 - Math.pow(2,(width.exp - 1)))
          trail = []; // denormal
        else
          trail[0] = 1;
  
        for(var i = 1; i < -val.exp; i++) {
          trail.push(0);
        }
  
        trail = val.man.slice(0, width.man).concat(trail);
      }
    }
  
    return [lead, trail];
  }
  
  function trailing_decimal2(binary) {
    // return a string of decimal digits
    // binary: array of 1 or 0, with binary[len-1] = 2**-1
  
    var decimal = '';
    // binary multiplication
    while(binary.length > 0) {
      var length = binary.length;
      // multiply by 10 = 0b1010
      binary = binary_add2([0].concat(binary), [0,0,0].concat(binary));
      decimal += bits_to_int2(binary.slice(length)).toString();
      binary = binary.slice(binary.indexOf(1),length);
    }
  
    return decimal;
  }
  
  function leading_decimal2(binary) {
    // return a string of decimal digits
    // binary: array of 1 or 0, with binary[i] = 2**i
  
    // double dabble
    var bcd = Array(4 * Math.ceil(binary.length/3)).fill(0);
    for(var i = binary.length-1; i >= 0; i--) {
      for(var digit = 0; digit < bcd.length; digit+=4) {
        // if digit > 4
        if(bcd[digit+3] || bcd[digit+2] && (bcd[digit+1] || bcd[digit])) {
          // add 3
          var incremented = binary_add2(bcd.slice(digit,digit+4), [1,1]);
          for(var j = 0; j < 4; j++)
            bcd[digit+j] = incremented[j];
        }
      }
  
      // shift left
      bcd.pop();
      bcd.unshift(binary[i]);
    }
  
    var decimal = ''
    for(var digit = bcd.length; digit > 0; digit-=4) {
      var dec_digit = bits_to_int2(bcd.slice(digit-4,digit));
      if(decimal || dec_digit) // skip leading zeroes
        decimal = decimal + dec_digit.toString();
    }
  
    return decimal || '0';
  }
  
  function binary_add2(a, b) {
    if(a.length < b.length) {
      var longest = b;
      b = a;
      a = longest;
    }
  
    var carry = 0;
    var sum = Array(a.length);
  
    for(var i = 0; i < a.length; i++) {
      var bit_sum = a[i]+carry;
      if(i < b.length)
        bit_sum += b[i];
  
      sum[i] = +(bit_sum %  2);
      carry  = +(bit_sum >= 2);
    }
    if(carry)
      sum.push(1);
  
    return sum;
  }
  